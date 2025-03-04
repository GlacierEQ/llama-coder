# Troubleshooting Llama Coder

## Issue: Fetch Timeout / HeadersTimeoutError

If you see errors like:
```
TypeError: fetch failed
HeadersTimeoutError: Headers Timeout Error
```
try the following steps:

1. **Verify Network Connectivity:**  
   Ensure your internet connection is stable and that no firewall or proxy settings are interfering with outbound requests.

2. **Increase Timeout (if configurable):**  
   Check extension settings or configuration files for an option to increase the fetch timeout value (for example, a setting like `fetchTimeout`).

3. **Disable Conflicting Extensions:**  
   If you're using third-party extensions (such as Blackbox) that perform network requests, try disabling them temporarily to see if the issue persists.

4. **Review Developer Logs:**  
   Open VS Code’s Developer Tools (Help → Toggle Developer Tools → Console) for additional error details which might help isolate the problem.

5. **Open an Issue:**  
   If the problem continues, please consider reporting the issue on the project's GitHub repository with detailed logs.

Happy Troubleshooting!
