param (
    [string]$nodeParams
)
Invoke-Expression "node dist/app.js $nodeParams"