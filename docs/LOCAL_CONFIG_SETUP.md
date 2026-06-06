# Local config setup

Do not put real API keys or passwords in `appsettings.json`.

For local development, copy:

```powershell
Copy-Item .\MiniSeries.WebAPI\appsettings.Development.local.example.json .\MiniSeries.WebAPI\appsettings.Development.local.json
```

Then fill the real values in:

```text
MiniSeries.WebAPI/appsettings.Development.local.json
```

This file is ignored by Git, so the team can share it privately without committing it.

When adding a new API key later, add the placeholder to:

```text
MiniSeries.WebAPI/appsettings.json
MiniSeries.WebAPI/appsettings.Development.local.example.json
```

Then each developer adds the real value to their own:

```text
MiniSeries.WebAPI/appsettings.Development.local.json
```
