# launch-workbench.ps1 —— 项目启动脚本模板：复制到任意项目目录，配合「启动工作台.bat」使用
# 自动把所在目录设为 V7_PROJECT_DIR，并切到标准工具目录执行 npm run dev

$env:V7_PROJECT_DIR = $PSScriptRoot
Push-Location "$HOME\.automotion"
try {
    npm run dev
} finally {
    Pop-Location
}
