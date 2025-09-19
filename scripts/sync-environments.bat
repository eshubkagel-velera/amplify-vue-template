@echo off
echo Syncing shared files to all environments...

for %%e in (dev test uat prod) do (
    echo Syncing to %%e...
    xcopy shared environments\%%e\shared /E /I /Y /Q
    echo Synced shared files to %%e
)

echo All environments synced!