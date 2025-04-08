import chalk from 'chalk';
import { SessionState } from '../repl.js';
import { LixManager } from '../lix/lixManager.js';
import { createLLMAdapter } from '../agent/llm.js';
import path from 'path';

// Type for command handlers
type CommandHandler = (state: SessionState, args: string[]) => Promise<void>;

// Help command
async function handleHelpCommand(state: SessionState): Promise<void> {
  const outputMode = state.outputMode;
  
  if (outputMode === 'human') {
    console.log(chalk.cyan('Available commands:'));
    console.log(chalk.cyan('------------------'));
    console.log(`${chalk.green('/open')} <path>         - Open a .lix file (or create if it doesn't exist)`);
    console.log(`${chalk.green('/new')} [path]          - Create a new empty .lix file`);
    console.log(`${chalk.green('/save')} [path]         - Save the current .lix file`);
    console.log(`${chalk.green('/close')}               - Close the current .lix file`);
    console.log(`${chalk.green('/mode')} <human|json>   - Switch output mode`);
    console.log(`${chalk.green('/model')} <name>        - Switch LLM model (e.g., openai:gpt-4, anthropic:claude)`);
    console.log(`${chalk.green('/files')}               - List tracked files in the current .lix`);
    console.log(`${chalk.green('/add')} <path> <content>- Add a new file to track`);
    console.log(`${chalk.green('/backup')}              - Create a backup of the current .lix file`);
    console.log(`${chalk.green('/exit')} or ${chalk.green('/quit')}    - Exit the CLI`);
    console.log(`${chalk.green('/help')}                - Show this help message`);
    console.log('');
    console.log(chalk.cyan('For any other input, I\'ll interpret it as a natural language query or instruction.'));
  } else {
    console.log(JSON.stringify({
      commands: [
        { name: '/open', args: '<path>', description: 'Open a .lix file (or create if it doesn\'t exist)' },
        { name: '/new', args: '[path]', description: 'Create a new empty .lix file' },
        { name: '/save', args: '[path]', description: 'Save the current .lix file' },
        { name: '/close', args: '', description: 'Close the current .lix file' },
        { name: '/mode', args: '<human|json>', description: 'Switch output mode' },
        { name: '/model', args: '<name>', description: 'Switch LLM model (e.g., openai:gpt-4, anthropic:claude)' },
        { name: '/files', args: '', description: 'List tracked files in the current .lix' },
        { name: '/add', args: '<path> <content>', description: 'Add a new file to track' },
        { name: '/backup', args: '', description: 'Create a backup of the current .lix file' },
        { name: '/exit', args: '', description: 'Exit the CLI' },
        { name: '/quit', args: '', description: 'Exit the CLI' },
        { name: '/help', args: '', description: 'Show this help message' }
      ]
    }));
  }
}

// Open command
async function handleOpenCommand(state: SessionState, args: string[]): Promise<void> {
  const outputMode = state.outputMode;
  
  if (args.length < 1) {
    if (outputMode === 'human') {
      console.log(chalk.yellow('Usage: /open <path>'));
    } else {
      console.log(JSON.stringify({ error: 'Missing path argument for /open command' }));
    }
    return;
  }
  
  const filePath = args[0];
  
  try {
    // If we already have a Lix open, close it first
    if (state.activeLixManager) {
      await state.activeLixManager.close();
    }
    
    // Create a new LixManager if needed
    if (!state.activeLixManager) {
      state.activeLixManager = new LixManager();
    }
    
    // Try to open the file
    await state.activeLixManager.openFile(filePath);
    
    if (outputMode === 'human') {
      console.log(chalk.green(`Opened Lix file: ${filePath}`));
    } else {
      console.log(JSON.stringify({ success: true, file: filePath }));
    }
  } catch (error) {
    // The file might not exist, so try to create a new one
    try {
      // Create a new Lix
      if (!state.activeLixManager) {
        state.activeLixManager = new LixManager();
      }
      
      await state.activeLixManager.createNew();
      
      // Save it to the specified path
      await state.activeLixManager.saveFile(filePath);
      
      if (outputMode === 'human') {
        console.log(chalk.green(`Created and opened new Lix file: ${filePath}`));
      } else {
        console.log(JSON.stringify({ success: true, file: filePath, created: true }));
      }
    } catch (createError) {
      if (outputMode === 'human') {
        console.error(chalk.red(`Failed to open or create Lix file: ${createError instanceof Error ? createError.message : String(createError)}`));
      } else {
        console.error(JSON.stringify({ error: `Failed to open or create Lix file: ${createError instanceof Error ? createError.message : String(createError)}` }));
      }
    }
  }
}

// New command
async function handleNewCommand(state: SessionState, args: string[]): Promise<void> {
  const outputMode = state.outputMode;
  
  try {
    // If we already have a Lix open, close it first
    if (state.activeLixManager) {
      await state.activeLixManager.close();
    }
    
    // Create a new LixManager if needed
    if (!state.activeLixManager) {
      state.activeLixManager = new LixManager();
    }
    
    // Create a new empty Lix
    await state.activeLixManager.createNew();
    
    // If a path was specified, save it
    if (args.length > 0) {
      const filePath = args[0];
      await state.activeLixManager.saveFile(filePath);
      
      if (outputMode === 'human') {
        console.log(chalk.green(`Created new Lix file: ${filePath}`));
      } else {
        console.log(JSON.stringify({ success: true, file: filePath, created: true }));
      }
    } else {
      if (outputMode === 'human') {
        console.log(chalk.green('Created new in-memory Lix file (not saved to disk yet)'));
      } else {
        console.log(JSON.stringify({ success: true, inMemory: true }));
      }
    }
  } catch (error) {
    if (outputMode === 'human') {
      console.error(chalk.red(`Failed to create new Lix file: ${error instanceof Error ? error.message : String(error)}`));
    } else {
      console.error(JSON.stringify({ error: `Failed to create new Lix file: ${error instanceof Error ? error.message : String(error)}` }));
    }
  }
}

// Save command
async function handleSaveCommand(state: SessionState, args: string[]): Promise<void> {
  const outputMode = state.outputMode;
  
  if (!state.activeLixManager) {
    if (outputMode === 'human') {
      console.log(chalk.yellow('No Lix file is currently open. Use /new or /open first.'));
    } else {
      console.log(JSON.stringify({ error: 'No Lix file is currently open' }));
    }
    return;
  }
  
  try {
    // If a path was specified, use it
    const filePath = args.length > 0 ? args[0] : undefined;
    
    await state.activeLixManager.saveFile(filePath);
    
    const savedPath = state.activeLixManager.getCurrentFilePath();
    
    if (outputMode === 'human') {
      console.log(chalk.green(`Saved Lix file to: ${savedPath}`));
    } else {
      console.log(JSON.stringify({ success: true, file: savedPath }));
    }
  } catch (error) {
    if (outputMode === 'human') {
      console.error(chalk.red(`Failed to save Lix file: ${error instanceof Error ? error.message : String(error)}`));
    } else {
      console.error(JSON.stringify({ error: `Failed to save Lix file: ${error instanceof Error ? error.message : String(error)}` }));
    }
  }
}

// Close command
async function handleCloseCommand(state: SessionState): Promise<void> {
  const outputMode = state.outputMode;
  
  if (!state.activeLixManager) {
    if (outputMode === 'human') {
      console.log(chalk.yellow('No Lix file is currently open.'));
    } else {
      console.log(JSON.stringify({ error: 'No Lix file is currently open' }));
    }
    return;
  }
  
  try {
    await state.activeLixManager.close();
    state.activeLixManager = null;
    
    if (outputMode === 'human') {
      console.log(chalk.green('Closed the current Lix file.'));
    } else {
      console.log(JSON.stringify({ success: true }));
    }
  } catch (error) {
    if (outputMode === 'human') {
      console.error(chalk.red(`Failed to close Lix file: ${error instanceof Error ? error.message : String(error)}`));
    } else {
      console.error(JSON.stringify({ error: `Failed to close Lix file: ${error instanceof Error ? error.message : String(error)}` }));
    }
  }
}

// Mode command
async function handleModeCommand(state: SessionState, args: string[]): Promise<void> {
  const currentMode = state.outputMode;
  
  if (args.length < 1) {
    if (currentMode === 'human') {
      console.log(chalk.yellow('Usage: /mode <human|json>'));
      console.log(chalk.cyan(`Current mode: ${currentMode}`));
    } else {
      console.log(JSON.stringify({ error: 'Missing mode argument', currentMode }));
    }
    return;
  }
  
  const newMode = args[0].toLowerCase();
  
  if (newMode !== 'human' && newMode !== 'json') {
    if (currentMode === 'human') {
      console.log(chalk.yellow('Invalid mode. Valid modes are: human, json'));
    } else {
      console.log(JSON.stringify({ error: 'Invalid mode', validModes: ['human', 'json'] }));
    }
    return;
  }
  
  // Set the mode
  state.outputMode = newMode as 'human' | 'json';
  
  if (newMode === 'human') {
    console.log(chalk.green('Switched to human-readable output mode.'));
  } else {
    console.log(JSON.stringify({ success: true, mode: newMode }));
  }
}

// Model command
async function handleModelCommand(state: SessionState, args: string[]): Promise<void> {
  const outputMode = state.outputMode;
  
  if (args.length < 1) {
    if (outputMode === 'human') {
      console.log(chalk.yellow('Usage: /model <name>'));
      console.log(chalk.cyan(`Current model: ${state.agent.llmAdapter.name}`));
      console.log(chalk.cyan('Examples: openai:gpt-4, anthropic:claude-2, local:default'));
    } else {
      console.log(JSON.stringify({ 
        error: 'Missing model argument', 
        currentModel: state.agent.llmAdapter.name,
        examples: ['openai:gpt-4', 'anthropic:claude-2', 'local:default']
      }));
    }
    return;
  }
  
  const modelSpec = args[0];
  
  try {
    // Create a new LLM adapter
    const newAdapter = createLLMAdapter(modelSpec);
    
    // Update the agent with the new adapter
    state.agent.setLLMAdapter(newAdapter);
    
    if (outputMode === 'human') {
      console.log(chalk.green(`Switched to model: ${newAdapter.name}`));
    } else {
      console.log(JSON.stringify({ success: true, model: newAdapter.name }));
    }
  } catch (error) {
    if (outputMode === 'human') {
      console.error(chalk.red(`Failed to switch model: ${error instanceof Error ? error.message : String(error)}`));
    } else {
      console.error(JSON.stringify({ error: `Failed to switch model: ${error instanceof Error ? error.message : String(error)}` }));
    }
  }
}

// Files command
async function handleFilesCommand(state: SessionState): Promise<void> {
  const outputMode = state.outputMode;
  
  if (!state.activeLixManager) {
    if (outputMode === 'human') {
      console.log(chalk.yellow('No Lix file is currently open. Use /new or /open first.'));
    } else {
      console.log(JSON.stringify({ error: 'No Lix file is currently open' }));
    }
    return;
  }
  
  const lix = state.activeLixManager.getLixObject();
  
  if (!lix) {
    if (outputMode === 'human') {
      console.log(chalk.yellow('No Lix object available.'));
    } else {
      console.log(JSON.stringify({ error: 'No Lix object available' }));
    }
    return;
  }
  
  try {
    // Use direct SQL query to get files
    const files = await lix.db
      .selectFrom('file')
      .select(['path'])
      .execute();
    
    const filePaths = files.map(file => file.path);
    
    if (outputMode === 'human') {
      if (filePaths.length === 0) {
        console.log(chalk.yellow('No files currently tracked in this Lix file.'));
      } else {
        console.log(chalk.cyan('Tracked files:'));
        filePaths.forEach((file, index) => {
          console.log(`${index + 1}. ${file}`);
        });
      }
    } else {
      console.log(JSON.stringify({ files: filePaths }));
    }
  } catch (error) {
    if (outputMode === 'human') {
      console.error(chalk.red(`Failed to list files: ${error instanceof Error ? error.message : String(error)}`));
    } else {
      console.error(JSON.stringify({ error: `Failed to list files: ${error instanceof Error ? error.message : String(error)}` }));
    }
  }
}

// Add file command
async function handleAddCommand(state: SessionState, args: string[]): Promise<void> {
  const outputMode = state.outputMode;
  
  if (!state.activeLixManager) {
    if (outputMode === 'human') {
      console.log(chalk.yellow('No Lix file is currently open. Use /new or /open first.'));
    } else {
      console.log(JSON.stringify({ error: 'No Lix file is currently open' }));
    }
    return;
  }
  
  const lix = state.activeLixManager.getLixObject();
  
  if (!lix) {
    if (outputMode === 'human') {
      console.log(chalk.yellow('No Lix object available.'));
    } else {
      console.log(JSON.stringify({ error: 'No Lix object available' }));
    }
    return;
  }
  
  if (args.length < 2) {
    if (outputMode === 'human') {
      console.log(chalk.yellow('Usage: /add <path> <content>'));
    } else {
      console.log(JSON.stringify({ error: 'Missing arguments for /add command' }));
    }
    return;
  }
  
  const filePath = args[0];
  const content = args.slice(1).join(' ');
  
  try {
    // Use direct SQL query to add the file
    const contentBuffer = Buffer.from(content, 'utf8');
    
    await lix.db
      .insertInto('file')
      .values({ 
        path: filePath, 
        data: contentBuffer 
      })
      .execute();
    
    if (outputMode === 'human') {
      console.log(chalk.green(`Added file: ${filePath}`));
    } else {
      console.log(JSON.stringify({ success: true, file: filePath }));
    }
  } catch (error) {
    if (outputMode === 'human') {
      console.error(chalk.red(`Failed to add file: ${error instanceof Error ? error.message : String(error)}`));
    } else {
      console.error(JSON.stringify({ error: `Failed to add file: ${error instanceof Error ? error.message : String(error)}` }));
    }
  }
}

// Backup command
async function handleBackupCommand(state: SessionState): Promise<void> {
  const outputMode = state.outputMode;
  
  if (!state.activeLixManager) {
    if (outputMode === 'human') {
      console.log(chalk.yellow('No Lix file is currently open. Use /new or /open first.'));
    } else {
      console.log(JSON.stringify({ error: 'No Lix file is currently open' }));
    }
    return;
  }
  
  // Get the current file path
  const filePath = state.activeLixManager.getCurrentFilePath();
  if (!filePath) {
    if (outputMode === 'human') {
      console.log(chalk.yellow('Cannot create backup for an unsaved Lix file. Use /save first.'));
    } else {
      console.log(JSON.stringify({ error: 'Cannot create backup for an unsaved Lix file' }));
    }
    return;
  }
  
  try {
    // Create backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:T\-Z\.]/g, '');
    const dir = path.dirname(filePath);
    const base = path.basename(filePath);
    const backupPath = path.join(dir, `.${base}.backup.${timestamp}`);
    
    // Save to the backup location
    await state.activeLixManager.saveFile(backupPath);
    
    if (outputMode === 'human') {
      console.log(chalk.green(`Created backup at: ${backupPath}`));
    } else {
      console.log(JSON.stringify({ success: true, backupPath }));
    }
  } catch (error) {
    if (outputMode === 'human') {
      console.error(chalk.red(`Failed to create backup: ${error instanceof Error ? error.message : String(error)}`));
    } else {
      console.error(JSON.stringify({ error: `Failed to create backup: ${error instanceof Error ? error.message : String(error)}` }));
    }
  }
}

// Save Diff command
async function handleSaveDiffCommand(state: SessionState, args: string[]): Promise<void> {
  const outputMode = state.outputMode;
  
  if (args.length < 1) {
    if (outputMode === 'human') {
      console.log(chalk.yellow('Usage: /saveDiff <path>'));
    } else {
      console.log(JSON.stringify({ error: 'Missing path argument for /saveDiff command' }));
    }
    return;
  }
  
  const filePath = args[0];
  
  // This command would require us to track the last diff shown
  // As a placeholder implementation, we'll just create an example diff
  try {
    const original = `{
  "name": "example",
  "version": "1.0.0",
  "description": "Example for diff"
}`;
    
    const modified = `{
  "name": "example",
  "version": "2.0.0",
  "description": "Example for diff",
  "updated": true
}`;
    
    // Get the output formatter from the agent
    const outputFormatter = state.agent['outputFormatter'];
    
    // Save the diff
    await outputFormatter.saveDiffToPatchFile(original, modified, filePath);
    
    if (outputMode === 'human') {
      console.log(chalk.green(`Example diff saved to: ${filePath}`));
      console.log(chalk.yellow('Note: This is an example diff. In a full implementation, this would save your last actual diff.'));
    } else {
      console.log(JSON.stringify({ 
        success: true, 
        file: filePath,
        note: 'This is an example diff. In a full implementation, this would save your last actual diff.' 
      }));
    }
  } catch (error) {
    if (outputMode === 'human') {
      console.error(chalk.red(`Failed to save diff: ${error instanceof Error ? error.message : String(error)}`));
    } else {
      console.error(JSON.stringify({ error: `Failed to save diff: ${error instanceof Error ? error.message : String(error)}` }));
    }
  }
}

// Export all command handlers
export const commandHandlers: Record<string, CommandHandler> = {
  help: handleHelpCommand,
  open: handleOpenCommand,
  new: handleNewCommand,
  save: handleSaveCommand,
  close: handleCloseCommand,
  mode: handleModeCommand,
  model: handleModelCommand,
  files: handleFilesCommand,
  add: handleAddCommand,
  backup: handleBackupCommand,
};