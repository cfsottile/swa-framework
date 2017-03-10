#!/bin/bash

for f in oscars.js wikipedia.js; do

cat ../augmentation.js >../cdn/$f
cat ../examples/$f >>../cdn/$f

done
