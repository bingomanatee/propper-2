## 3.0.0

Added Propper to rollup; rebuilt from scratch. 
reduced features, file size, dependencies.
(specifically "required" is no longer part of propper)

## 3.0.1

replaced is.js with @wonderlandlabs/validators to
reduce footprint

## 3.0.2

removed lodash.get as a dependency
streamlined property definition
removed setOnGet (always true now)
removed makeOnBadProperty. (if you want to test for bad-ness use an onChange hook)
