# Errwischt.js - ErrorTracking Client for Errwischt Error Tracker

## Installation (Three flavours)

This error client is bundled with a fork of [TraceKit](https://github.com/occ/TraceKit). This is, because we will also provide stack traces of errors that were not caught by a try..catch block.

You can choose between three ways, how to load the errwischt.js file. In each case, we recommend to put the snippet into the head, to catch as much errors as possible.

### Bundled min file

The first one is a complete bundle. For this, you will simply load the `errwischt.min.js` file. And setup Errwischt according your API key. It might look like this:

``` JavaScript
  <script src="errwischt.js"></script>
  <script>
  (function() {
    Errwischt.setup('your api key goes here');
  }());
  </script>
```

Now, when ever an error occures, it will be send right away to the errwischt error server. But the user have to load the full package up front, although he might not encouter any error.

### Errwischt.js + Dependencies

To reduce the filesize (and with this the performance of your loading page) we suggest loading the `errwischt.pure.min.js` and configure the url for the `errwischt.deps.min.js` file. This might look like this:

``` JavaScript
  <script src="errwischt.pure.min.js"></script>
  <script>
  (function() {
    Errwischt.setup('your api key goes here');
    Errwischt.depsSrc = 'errwischt.deps.min.js';
  }());
  </script>
```

Now the user has to load much less code. If an error occures, errwischt.js will then load the needed dependencies by itself, and will still provide useful stack traces.

### Pure Errwischt.js

You can minimize the amount of code the user has to load when you only load the `errwischt.pure.min.js` file and don't define a `depsSrc` property.

``` JavaScript
  <script src="errwischt.pure.min.js"></script>
  <script>
  (function() {
    Errwischt.setup('your api key goes here');
  }());
  </script>
```

But you won't neccessarily get stack traces on errors you do not catch by yourself.

