import { Sqlite3Static, WasmPointer } from "@eliaspourquoi/sqlite-node-wasm";

// CREATE VIRTUAL TABLE peson USING InMemoryArrayVirtualTable (name, age))

const MODULE_NAME = "InMemoryArrayVirtualTable";

// This is an example implementation of a SQLite module (for virtual
// tables). It lets SQLite access a Javascript array as a table.
// See https://sqlite.org/vtab.html for details.
//
// inspired by https://github.com/vlcn-io/wa-sqlite/blob/232f21ae4b89972ca70f999554bb39a8ddc9a853/src/examples/ArrayModule.js#L272 but for wasmsqlite
//
export class InMemoryArrayVirtualTable {
  mapCursorToState = new Map();
  vtabToName = new Map();

  sqlite3: Sqlite3Static;
  db: any;

  // store references to the data underneath virtual table'
  tablePaths: Record<string, string> = {};
  tableData: Record<string, any[]> = {};
  tableColumns: Record<string, { name: string }[]> = {};

  /**
   * @param {SQLiteAPI} sqlite3
   * @param {number} db
   */
  constructor(sqlite3: any, db: WasmPointer) {
    this.sqlite3 = sqlite3;
    this.db = db;

    const module = new this.sqlite3.capi.sqlite3_module();

    module.installMethods(
      {
        xCreate: this.xCreate.bind(this),
        xConnect: this.xConnect.bind(this),
        xBestIndex: this.xBestIndex.bind(this),
        xDisconnect: this.xDisconnect.bind(this),
        xDestroy: this.xDestroy.bind(this),
        xOpen: this.xOpen.bind(this),
        xClose: this.xClose.bind(this),
        xFilter: this.xFilter.bind(this),
        xNext: this.xNext.bind(this),
        xEof: this.xEof.bind(this),
        xColumn: this.xColumn.bind(this),
        xRowid: this.xRowid.bind(this),
        xUpdate: this.xUpdate.bind(this),
      },
      false,
    );

    this.sqlite3.capi.sqlite3_create_module(db, MODULE_NAME, module, 0);
  }

  /**
   * use this function to get access to the array that juicess the virtual table
   * @param name the name of the virtual table
   * @returns a ref to the array that is used as the virtual table
   */
  getVirtualTableDataRef(name: string) {
    if (this.tableData[name]) {
      return this.tableData[name];
    } else {
      throw new Error(
        `Table ${name} not found creat it using "CREATE VIRTUAL TABLE ${name} USING InMemoryArraysVT(column1, column2,...)" first`,
      );
    }
  }

  xCreate(
    db: WasmPointer,
    pAux: WasmPointer,
    argc: number,
    argv: WasmPointer,
    pVTab: WasmPointer,
    pzErr: WasmPointer,
  ) {
    const values = this.sqlite3.wasm.cArgvToJs(argc, argv)!;
    if (
      values.length <
      3 /* moduleName, database, tableName */ +
        1 /** passed as module arguments id column ... */
    ) {
      return this.sqlite3.vtab.xError(
        "xCreate",
        new Error(`${MODULE_NAME} requires at least 4 params`),
        this.sqlite3.capi.SQLITE_ERROR,
      );
    }

    const moduleName = values.shift();
    const databaseName = values.shift();
    const tableName = values.shift()!;
    const columnDefinitions = values as string[];

    if (this.tableData[tableName]) {
      // TODO table exists already - how to fail?
      // TODO how to handle case that the table is created as part of the start script? IF NOT EXISTS?
      return this.sqlite3.vtab.xError(
        "xCreate",
        new Error(`Table exists already?`),
        this.sqlite3.capi.SQLITE_ERROR,
      );
    } else {
      const columns = columnDefinitions.map((columnDefinition) => ({
        name: columnDefinition,
      }));

      this.tableData[tableName] = [];

      this.tableColumns[tableName] = columns;
    }

    // NOTE: table name is x because "the name of the table in this CREATE TABLE statement is ignored" (https://sqlite.org/vtab.html#xcreate)
    const sql = `CREATE TABLE x (${columnDefinitions.join(",")})`;

    // we declare the vtab to let sqlite database know the columns and types
    const result = this.sqlite3.capi.sqlite3_declare_vtab(db, sql);
    if (result !== this.sqlite3.capi.SQLITE_OK) {
      // TODO how do we get more information and propagate them as sqlite error?
      return result;
    }
    // now that the table was declared successuflly
    const vtab = this.sqlite3.vtab.xVtab.create(pVTab);

    // TODO remove reference again
    this.vtabToName.set(vtab.pointer, tableName);

    return this.sqlite3.capi.SQLITE_OK;
  }

  xConnect(
    db: WasmPointer,
    pAux: WasmPointer,
    argc: number,
    argv: WasmPointer,
    pVTab: WasmPointer,
    pzErr: WasmPointer,
  ) {
    console.log("xConnect");
    // All virtual tables in this module will use the same array. If
    // different virtual tables could have separate backing stores then
    // we would handle that association using pVTab.

    //   console.log('sqlite3_declare_vtab')
    // throw new Error("test")
    return this.sqlite3.capi.SQLITE_OK;
  }

  xBestIndex(pVtab: WasmPointer, pIndexInfo: WasmPointer) {
    const idxInfo = this.sqlite3.vtab.xIndexInfo(pIndexInfo);

    // Track which columns have equality constraints
    const usableConstraints: string[] = [];
    let argIndex = 0;

    // Column mapping (matching the CREATE TABLE order in xCreate/xConnect)
    const columnMap = [
      "name", // 0
      "age", // 1
    ];

    // Process constraints
    for (let i = 0; i < idxInfo.$nConstraint; i++) {
      const constraint = idxInfo.nthConstraint(i);

      // Only handle equality constraints that are usable
      if (
        constraint.$op === this.sqlite3.capi.SQLITE_INDEX_CONSTRAINT_EQ &&
        constraint.$usable
      ) {
        const columnName = columnMap[constraint.$iColumn];
        if (columnName) {
          usableConstraints.push(columnName);

          // Mark this constraint as used
          idxInfo.nthConstraintUsage(i).$argvIndex = ++argIndex;
          idxInfo.nthConstraintUsage(i).$omit = 1; // SQLite can omit this constraint
        }
      }
    }

    // Set the index string to pass column names to xFilter
    if (usableConstraints.length > 0) {
      const idxStr = usableConstraints.join(",");
      idxInfo.$idxStr = this.sqlite3.wasm.allocCString(idxStr, false);
      idxInfo.$needToFreeIdxStr = 1;

      // Lower cost when we can use filters (more selective)
      idxInfo.$estimatedCost = 1000.0;
      idxInfo.$estimatedRows = 1000;
    } else {
      // idxInfo.$idxStr = "";
      idxInfo.$needToFreeIdxStr = 0;

      // Higher cost for full table scan
      idxInfo.$estimatedCost = 1000000.0;
      idxInfo.$estimatedRows = 100000;
    }
  }

  xDisconnect(pVTab: WasmPointer) {
    // console.log('xDisconnect')
    return this.sqlite3.capi.SQLITE_OK;
  }

  xDestroy(pVTab: WasmPointer) {
    // console.log('xDestroy')
    return this.sqlite3.capi.SQLITE_OK;
  }

  xOpen(pVTab: WasmPointer, pCursor: WasmPointer) {
    const c = this.sqlite3.vtab.xCursor.create(pCursor);
    console.log("xopen", this.vtabToName);
    this.mapCursorToState.set(c.pointer, {
      tableName: this.vtabToName.get(pVTab)!,
    });
    return this.sqlite3.capi.SQLITE_OK;
  }

  /**
   * @param {number} pCursor
   * @returns {number}
   */
  xClose(pCursor: WasmPointer) {
    // console.log('xclose')
    this.mapCursorToState.delete(pCursor);
    return this.sqlite3.capi.SQLITE_OK;
  }

  /**
   * @param {number} pCursor
   * @param {number} idxNum
   * @param {string?} idxStr
   * @param {Array<number>} values
   * @returns {number}
   */
  xFilter(
    pCursor: WasmPointer,
    idxNum: number,
    pIdxStr: WasmPointer,
    argc: number,
    argv: WasmPointer,
  ) {
    const cursorState = this.mapCursorToState.get(pCursor);
    cursorState.index = 0;

    console.log("this.tableData", this.tableData);
    console.log("tableName:", cursorState.tableName);
    cursorState.endIndex = this.tableData[cursorState.tableName].length;

    const idxStr = this.sqlite3.wasm.cstrToJs(pIdxStr) as string;

    // Extract filter arguments if provided
    const filters: Record<string, string> = {};
    if (argc > 0 && argv) {
      const args = this.sqlite3.capi.sqlite3_values_to_js(argc, argv);
      // Parse idxStr to understand which columns are being filtered
      // idxStr format: "column1,column2,..."
      if (idxStr) {
        const columns = idxStr.split(",").filter((c) => c.length > 0);
        for (let i = 0; i < Math.min(columns.length, args.length); i++) {
          if (args[i] !== null && args[i] !== undefined) {
            filters[columns[i]!] = String(args[i]);
          }
        }
      }
    }

    // TODO implement filtering
    return this.sqlite3.capi.SQLITE_OK;
  }

  /**
   * @param {number} pCursor
   * @returns {number}
   */
  xNext(pCursor: WasmPointer) {
    // Advance to the next valid row or EOF.
    const cursorState = this.mapCursorToState.get(pCursor);
    ++cursorState.index;
    // console.log('xnext index: ' + cursorState.index)
    this._adjustCursorIfInvalid(cursorState);
    return this.sqlite3.capi.SQLITE_OK;
  }

  /**
   * @param {number} pCursor
   * @returns {number}
   */
  xEof(pCursor: WasmPointer) {
    const cursorState = this.mapCursorToState.get(pCursor);
    // console.log('xEof' + cursorState.endIndex + " " + cursorState.index < cursorState.endIndex)
    return cursorState.index < cursorState.endIndex ? 0 : 1;
  }

  /**
   * @param {number} pCursor
   * @param {number} pContext
   * @param {number} iCol
   * @returns {number}
   */
  xColumn(pCursor: WasmPointer, pContext: WasmPointer, iCol: number) {
    // console.log('xColumn')
    const cursorState = this.mapCursorToState.get(pCursor);
    this._adjustCursorIfInvalid(cursorState);
    const columnDef = this.tableColumns[cursorState.tableName][iCol];
    const value = (this.tableData[cursorState.tableName] as any)[
      cursorState.index
    ][columnDef.name];
    //   console.log(columnName, value)

    if (typeof value === "object") {
      // we pass objects as stringified objects to allow to call json expressions on them
      this.sqlite3.capi.sqlite3_result_js(pContext, JSON.stringify(value));
    } else {
      // we use sqlite3_result_js to detect the type of the column here
      this.sqlite3.capi.sqlite3_result_js(pContext, value);
    }
    return this.sqlite3.capi.SQLITE_OK;
  }

  /**
   * @param {number} pCursor
   * @param {DataView} pRowid
   * @returns {number}
   */
  xRowid(pCursor: WasmPointer, pRowid: WasmPointer) {
    // console.log('xColumn')
    const cursorState = this.mapCursorToState.get(pCursor);
    this.sqlite3.vtab.xRowid(pRowid, cursorState.index);
    return this.sqlite3.capi.SQLITE_OK;
  }

  // All "x" methods beyond this point are optional.

  /**
   * https://sqlite.org/vtab.html#xupdate
   * @param {number} pVTab
   * @param {Array<number>} values sqlite3_value pointers
   * @param {DataView} pRowid
   * @returns {number}
   */
  xUpdate(
    pVTab: WasmPointer,
    argc: number,
    argv: WasmPointer,
    pRowid: WasmPointer,
  ) {
    // console.log('xUpdate!')
    const tableName = this.vtabToName.get(pVTab)!;

    const values = this.sqlite3.capi.sqlite3_values_to_js(argc, argv)!;

    if (values.length === 0) {
      throw new Error("Illegal state - no arguments found");
    }

    if (values.length == 1) {
      const entryIdToDelete = values[0] as number | null;
      if (entryIdToDelete === null) {
        throw new Error(
          "Illegal state - we expect the id of the record to delete",
        );
      }
      // DELETE: The single row with rowid or PRIMARY KEY equal to argv[0] is deleted. No insert occurs.
      delete this.tableData[tableName][entryIdToDelete]; //  = undefined;
    } else {
      if (values[0] === null) {
        const entityToInsert = {} as any;
        // INSERT: A new row is inserted with column values taken from argv[2] and following. In a rowid virtual table, if argv[1] is an SQL NULL, then a new unique rowid is generated automatically. The argv[1] will be NULL for a WITHOUT ROWID virtual table, in which case the implementation should take the PRIMARY KEY value from the appropriate column in argv[2] and following.
        for (let i = 2; i < values.length; ++i) {
          entityToInsert[this.tableColumns[tableName][i - 2]!.name] = values[i];
        }
        const rowId = this.tableData[tableName].length;

        this.sqlite3.vtab.xRowid(pRowid, rowId);
        this.tableData[tableName][rowId] = entityToInsert;
      } else {
        if (values[0] === values[1]) {
          const rowId = values[0]!;
          // UPDATE: The row with rowid or PRIMARY KEY argv[0] is updated with new values in argv[2] and following parameters.
          const entryToUpdate = this.tableData[tableName][
            values[0] as number
          ] as any;

          for (let i = 2; i < values.length; ++i) {
            // TODO check if the corresponding value has changed using sqlite3_value_nochange(X)
            entryToUpdate[this.tableColumns[tableName][i - 2].name] = values[i];
          }
        } else {
          // UPDATE with rowid or PRIMARY KEY change: The row with rowid or PRIMARY KEY argv[0] is updated with the rowid or PRIMARY KEY in argv[1] and new values in argv[2] and following parameters. This will occur when an SQL statement updates a rowid, as in the statement:
          // UPDATE table SET rowid=rowid+1 WHERE ...;

          const previousRowId = values[0] as number;
          const newRowId = values[1]! as number;

          const entryToUpdate = this.tableData[tableName][previousRowId] as any;

          // drop the entry at the old position
          delete this.tableData[tableName][previousRowId];

          // apply new values to old entry
          for (let i = 2; i < values.length; ++i) {
            // TODO check if the corresponding value has changed using sqlite3_value_nochange(X)
            entryToUpdate[this.tableColumns[tableName][i - 2].name] = values[i];
          }

          // add the entry to the new slot
          this.tableData[tableName][newRowId] = entryToUpdate;
        }
      }
    }
    return this.sqlite3.capi.SQLITE_OK;
  }

  // xBegin(pVTab) { return SQLite.SQLITE_OK; }
  // xSync(pVTab) { return SQLite.SQLITE_OK; }
  // xCommit(pVTab) { return SQLite.SQLITE_OK; }
  // xRollback(pVTab) { return SQLite.SQLITE_OK; }
  // xRename(pVTab, zNew) { return SQLite.SQLITE_OK; }

  /**
   * Ensure cursor index references either a valid (non-null) row or EOF.
   * Rows become invalid by deletion.
   */
  _adjustCursorIfInvalid(cursorState: any) {
    while (
      cursorState.index < cursorState.endIndex &&
      !this.tableData[cursorState.tableName][cursorState.index]
    ) {
      ++cursorState.index;
    }
  }
}
