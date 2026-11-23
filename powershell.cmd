@echo off
set "WORKSPACE_DIR=c:\Users\amrut\OneDrive\Desktop\student_management"
set "PATH=%WORKSPACE_DIR%\tools\w64devkit\bin;C:\Windows\System32;C:\Windows;C:\Windows\System32\Wbem;C:\Windows\System32\WindowsPowerShell\v1.0;%USERPROFILE%\.cargo\bin;C:\Program Files\PostgreSQL\18\bin;%PATH%"
set "CC=%WORKSPACE_DIR%\tools\w64devkit\bin\gcc.exe"
set "AR=%WORKSPACE_DIR%\tools\w64devkit\bin\ar.exe"
powershell.exe %*
