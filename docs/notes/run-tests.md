# Run Unit Test

## 1. Create the virtual environment

Run once from the workspace root (`d:\CURRENT-WORK\meshlogiq\meshlogiq-plat`).

```powershell
# Create the venv (uses the system Python 3.14)
python -m venv .venv

# Activate (PowerShell)
.\.venv\Scripts\Activate.ps1

# Activate (cmd)
.\.venv\Scripts\activate.bat
```

## 2. Install dependencies

```powershell
pip install `
  -r platform/services/auth-gateway/requirements.txt `
  -r tests/requirements-test.txt
```

## 3. Run the tests

```powershell
# From workspace root — all 52 tests
.\.venv\Scripts\pytest.exe tests/auth_gateway/ -v

# By marker
.\.venv\Scripts\pytest.exe -m login
.\.venv\Scripts\pytest.exe -m token

# Single file
.\.venv\Scripts\pytest.exe tests/auth_gateway/test_login.py -v
```