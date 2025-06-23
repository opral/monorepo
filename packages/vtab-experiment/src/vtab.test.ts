import { createInMemoryDatabase } from "sqlite-wasm-kysely";
import { describe, it, expect } from "vitest";
import { InMemoryArrayVirtualTable } from "./InMemoryArrayVirtualTable";

describe("Async Test Example", () => {
  it("should resolve with the correct value", async () => {
    const sqliteDb = await createInMemoryDatabase({
      readOnly: false,
    });

    const sqliteModule = sqliteDb.sqlite3;
    const moduleInstance = new InMemoryArrayVirtualTable(
      sqliteModule,
      sqliteDb.pointer!,
    );

    let errorPointer;
    const resultExec = sqliteModule.capi.sqlite3_exec(
      sqliteDb,
      "CREATE VIRTUAL TABLE my_array USING InMemoryArrayVirtualTable(age, name)",
      function (args) {
        // console.log(args)
      },
      1,
      errorPointer,
    );

    // ok the vtable should be created -> get the pointer to the array

    const array = moduleInstance.getVirtualTableDataRef("my_array");
    array.push({
      name: "Max",
      age: 10,
    });
    array.push({
      name: "Fred",
      age: 2,
    });

    console.log("result", resultExec);

    const selectAll = await sqliteDb.exec({
      sql: "select * from my_array",
      returnValue: "resultRows",
      rowMode: "object",
    });

    expect(selectAll.length).toBe(2);
    expect(selectAll[0]).toEqual(array[0]);
    expect(selectAll[1]).toEqual(array[1]);

    // Insert a new row into the virtual_array_table
    await sqliteDb.exec({
      sql: "INSERT INTO my_array (name, age) VALUES (?, ?)",
      bind: ["Fridolin", 4],
    });

    // Verify the new row was added
    const updatedSelectAll = await sqliteDb.exec({
      sql: "select * from my_array",
      returnValue: "resultRows",
      rowMode: "object",
    });

    expect(updatedSelectAll.length).toBe(3);
    expect(updatedSelectAll[2]).toEqual({ name: "Fridolin", age: 4 });
  });

  it("should resolve with the correct value", async () => {
    const sqliteDb = await createInMemoryDatabase({
      readOnly: false,
    });

    const sqliteModule = sqliteDb.sqlite3;
    const moduleInstance = new InMemoryArrayVirtualTable(
      sqliteModule,
      sqliteDb.pointer!,
    );

    let errorPointer;
    const resultExec = sqliteModule.capi.sqlite3_exec(
      sqliteDb,
      "CREATE VIRTUAL TABLE my_array USING InMemoryArrayVirtualTable(age, name)",
      function (args) {
        // console.log(args)
      },
      1,
      errorPointer,
    );

    // ok the vtable should be created -> get the pointer to the array

    const array = moduleInstance.getVirtualTableDataRef("my_array");
    array.push({
      name: "Max",
      age: 10,
    });
    array.push({
      name: "Fred",
      age: 2,
    });

    console.log("result", resultExec);

    // const selectAll = await sqliteDb.exec({
    //   sql: "select * from my_array",
    //   returnValue: "resultRows",
    //   rowMode: "object",
    // });

    // expect(selectAll.length).toBe(2);
    // expect(selectAll[0]).toEqual(array[0]);
    // expect(selectAll[1]).toEqual(array[1]);

    // // Insert a new row into the virtual_array_table
    // await sqliteDb.exec({
    //   sql: "INSERT INTO my_array (name, age) VALUES (?, ?)",
    //   bind: ["Fridolin", 4],
    // });

    // Verify the new row was added
    const updatedSelectAll = await sqliteDb.exec({
      sql: "select * from my_array where age = 10 or age = 19",
      returnValue: "resultRows",
      rowMode: "object",
    });

    expect(updatedSelectAll.length).toBe(1);
    expect(updatedSelectAll[0]).toEqual({ name: "Max", age: 10 });
  });
});
