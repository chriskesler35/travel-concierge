@echo off
echo Cleaning up Node processes and ports...

REM Kill all Node.js processes
echo Terminating all Node.js processes...
taskkill //F //IM node.exe 2>nul
if %errorlevel% == 0 (
    echo Successfully terminated Node processes
) else (
    echo No Node processes found or already terminated
)

REM Kill processes on common development ports
echo Checking port 5173 (Vite default)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do (
    echo Killing process on port 5173 (PID: %%a)
    taskkill //PID %%a //F 2>nul
)

echo Checking port 3000 (common dev port)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo Killing process on port 3000 (PID: %%a)
    taskkill //PID %%a //F 2>nul
)

echo Checking port 5174 (Vite alternative)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5174') do (
    echo Killing process on port 5174 (PID: %%a)
    taskkill //PID %%a //F 2>nul
)

echo.
echo Port cleanup complete!
echo You can now run 'npm run dev' without port conflicts.
pause