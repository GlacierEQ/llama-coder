# Code Citations

## License: MIT
https://github.com/ex3ndr/aluminium/tree/3f6dcb99e89fa77607a06937147d8d4f44198b96/src/sync/AsyncLock.ts

```
number = 1;
    private promiseResolverQueue: Array<(v: boolean) => void> = [];

    async inLock<T>(func: () => Promise<T> | T): Promise<T> {
        try {
            await this.lock()
```


## License: unknown
https://github.com/ollie041114/Summer2021/tree/78565b74febb282055d3e09b7c89979df10faeee/node_modules/semaphore-async-await/dist/Semaphore.js

```
.permits += 1;
        if (this.permits > 1 && this.promiseResolverQueue.length > 0) {
            throw new Error('this.permits should never be > 0 when there is someone waiting.');
        } else if (this.permits ==
```

