# Unmodified P6.1 baseline verification

Commit fc8b954. This is not new-art integration validation.

```text

> zsroom@0.1.0 test
> vitest run


 RUN  v5.1.0 /workspace/ZsRoom-p61-art-audit


 Test Files  21 passed (21)
      Tests  143 passed (143)
   Start at  04:09:30
   Duration  4.20s (tests 48%, import 35%, transform 16%, worker 1%)

    Isolate  21 workers spawned · ~137ms startup each (spawn + environment, per file)
             at least ~819ms faster with isolate: false — reuses workers across files instead of one per file


```
