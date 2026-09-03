#!/bin/bash
# Start SQL Server in the background
/opt/mssql/bin/sqlservr &
PID=$!

echo "Waiting for SQL Server to be ready..."
for i in {1..30}; do
    /opt/mssql-tools18/bin/sqlcmd -S localhost -U SA -P "$MSSQL_SA_PASSWORD" -Q "SELECT 1" -b -No 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "SQL Server is ready. Applying initialization..."
        break
    fi
    echo "Not ready yet... attempt $i/30"
    sleep 2
done

# Enable Mixed Mode Authentication (SQL Server + Windows Auth)
# and ensure SA is enabled with TCP access
/opt/mssql-tools18/bin/sqlcmd -S localhost -U SA -P "$MSSQL_SA_PASSWORD" -No -Q "
EXEC xp_instance_regwrite N'HKEY_LOCAL_MACHINE', N'Software\Microsoft\MSSQLServer\MSSQLServer', N'LoginMode', REG_DWORD, 2;
ALTER LOGIN sa ENABLE;
ALTER LOGIN sa WITH PASSWORD='$MSSQL_SA_PASSWORD';
"

echo "SQL Server initialization complete."

# Wait for SQL Server process to keep container alive
wait $PID
