@echo off
echo Starting Backend...
cd backend

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not found! Please install Python and add it to PATH.
    pause
    exit /b
)

if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

REM Try to activate, if fails, recreate
call venv\Scripts\activate
if %errorlevel% neq 0 (
    echo Activation failed. Recreating venv...
    rmdir /s /q venv
    python -m venv venv
    call venv\Scripts\activate
)

echo Installing dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

echo Starting Flask server...
python app.py
pause
