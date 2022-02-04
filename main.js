const { exec } = require('child_process');
const { join } = require('path');
const fs = require('fs');
const shell = require('electron').shell;

var lastFile, lastTimeSend, currentDir, currentProject, apiKey, cli;

function WakaTimeCli() {
  const args = Array.from(arguments);
  args.push(`--project "${currentProject}"`);
  args.push('--language "Game Maker Language"');
  args.push('--plugin "GMEdit Wakatime plugin"');
  args.push(`--key "${apiKey}"`);
  exec(`${cli} ${args.join(' ')}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
  });
}

function WakaTimeCliFile(file, save = false) {
  if (file != lastFile || save || Date.now() - lastTimeSend >= 2 * 60 * 1000) {
    WakaTimeCli(`--entity "${file}"`);
    lastFile = file;
    lastTimeSend = Date.now();
  }
}

(() => {
  GMEdit.register('gm-wakatime', {
    init: function (state) {
      currentDir = state.dir;

      const files = fs.readdirSync(currentDir);

      files.forEach((file) => {
        if (file.includes('wakatime-cli')) {
          cli = join(currentDir, file);
        }
      });

      try {
        const config = fs.readFileSync(join(currentDir, 'wakatime.api'), 'utf-8');
        if (config) {
          apiKey = config;
        }
      } catch (e) {
        const prompt = document.createElement('div');
        prompt.innerHTML = `
          <div style="position: fixed; top: 33%; left: 33%; justify-content: center; align-items: center; background-color: #fff; color: #000; padding: 5em;">
          <div>API KEY <a href="https://wakatime.com/api-key" target='_blank' id='api-key'>get</a> and press Enter</div>
            <input id='api-input' style="margin-top: 0.5em;width: 100%;" />
          </div>
          `;
        document.body.appendChild(prompt);

        document.getElementById('api-key').addEventListener('click', (e) => {
          e.preventDefault();
          shell.openExternal(e.target.href);
        });

        document.getElementById('api-input').addEventListener('keyup', (e) => {
          if (e.keyCode === 13) {
            apiKey = e.target.value;
            fs.writeFileSync(join(currentDir, 'wakatime.api'), apiKey);
            e.path[2].remove();
          }
        });
      }

      GMEdit.on('projectOpen', function (e) {
        currentProject = e.project.displayName;
      });

      GMEdit.on('fileOpen', function (e) {
        WakaTimeCliFile(e.file.path);
      });
      GMEdit.on('activeFileChange', function (e) {
        WakaTimeCliFile(e.file.path);
      });
      GMEdit.on('fileSave', function (e) {
        WakaTimeCliFile(e.file.path, true);
      });
    },
    cleanup: function () {},
  });
})();
