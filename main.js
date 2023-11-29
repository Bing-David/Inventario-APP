const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
// const electronReload = require('electron-reload');
const { ipcMain } = require('electron');



// Agrega estas líneas para configurar electron-reload
// if (process.env.NODE_ENV !== 'production') {
//     require('electron-reload')(__dirname, {
//       electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
//       hardResetMethod: 'exit',
//     });
//   }
// Agrega estas líneas para configurar electron-reload
  
  
function createWindow() {



/*----------------------------------------------*
*                                               *
*          CONFIGURACIONES GLOBALES             *
*                                               *
*-----------------------------------------------*/

  // Crea la ventana del navegador.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    icon: path.join(__dirname, 'ico.png'),
    webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true,
        contextIsolation: false
    },
    // frame: false
  });

  // Carga el archivo HTML principal.
  mainWindow.loadFile('index.html');


//minimize maximise window
ipcMain.on('minimize', () => {
    mainWindow.minimize();
  });
  
  ipcMain.on('close', () => {
    mainWindow.close();
  });
//minimize maximise window
  
mainWindow.setMinimumSize(800, 500);

  
}
/*----------------------------------------------------------*/







// Este método será llamado cuando Electron haya terminado de inicializarse.
app.whenReady().then(createWindow);




// Salir cuando todas las ventanas estén cerradas, excepto en macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});




app.on('activate', () => {
  // En macOS, vuelve a crear una ventana en la aplicación cuando se hace clic en el icono del dock
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
