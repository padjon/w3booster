:: filepath: d:\w3booster\w3booster-master\tools\loadFromProd.cmd
@echo off
setlocal

if "%PROD_URI%"=="" (
    echo PROD_URI must be set to the production MongoDB connection string. >&2
    exit /b 1
)
set "LOCAL_URI=mongodb://host.docker.internal/w3booster"
set "DB_NAME=w3booster"
set "DUMP_DIR_NAME=dump_prod"
set "DUMP_DIR_PATH=%CD%\%DUMP_DIR_NAME%"
set "DOCKER_DUMP_PATH=/dump"

echo Starting database export from Production to Local Host...

echo Creating temporary dump directory: "%DUMP_DIR_PATH%"
mkdir "%DUMP_DIR_PATH%" > nul 2>&1
if errorlevel 1 (
    echo Error creating dump directory "%DUMP_DIR_PATH%". Exiting. >&2
    goto :cleanup_error
)

echo Exporting database "%DB_NAME%" from Production...
docker run --rm -v "%DUMP_DIR_PATH%:%DOCKER_DUMP_PATH%" mongo mongodump --uri="%PROD_URI%" --db="%DB_NAME%" --out="%DOCKER_DUMP_PATH%"
if errorlevel 1 (
    echo Error during mongodump from Production. Exiting. >&2
    goto :cleanup_error
)
echo Export completed successfully.

echo Importing database "%DB_NAME%" into local MongoDB (%LOCAL_URI%)...
set "RESTORE_SOURCE_PATH=%DUMP_DIR_PATH%\%DB_NAME%"
docker run --rm -v "%DUMP_DIR_PATH%:%DOCKER_DUMP_PATH%" mongo mongorestore --uri="%LOCAL_URI%" --db="%DB_NAME%" --drop "%DOCKER_DUMP_PATH%/%DB_NAME%"
if errorlevel 1 (
    echo Error during mongorestore into Local host. Exiting. >&2
    goto :cleanup_error
)
echo Import completed successfully.

echo Cleaning up local dump directory: "%DUMP_DIR_PATH%"
if exist "%DUMP_DIR_PATH%" (
    rmdir /s /q "%DUMP_DIR_PATH%"
    if errorlevel 1 (
        echo Warning: Failed to remove local dump directory "%DUMP_DIR_PATH%". >&2
    )
)

echo Database export/import process finished.
goto :end

:cleanup_error
echo Cleaning up local dump directory after error: "%DUMP_DIR_PATH%"
if exist "%DUMP_DIR_PATH%" (
    rmdir /s /q "%DUMP_DIR_PATH%" > nul 2>&1
)
exit /b 1

:end
endlocal
exit /b 0
