# Packer
A library that helps `optimally` pack items into a package of specified weight.

## Definition of Optimal
A package is optimal; if it contains items that have the `highest total cost`. However, if more than one set of items have the same `highest total cost`, the set of items with the `lowest weight` is preferred.

## Input
The `pack` api accepts a `file path`, then reads and processes data from the file.

Each line contains the weight that the package can take (before the colon) and the list of items you need to choose. Each item is enclosed in parentheses where the 1st number is an item's index number, the 2nd is its weight and the 3rd is its costs. E.g. text file `/path/to/file/example.txt` contains
```
81 : (1,53.38,€45) (2,88.62,€98) (3,78.48,€3) (4,72.30,€76) (5,30.18,€9)
(6,46.34,€48)
8 : (1,15.3,€34)
75 : (1,85.31,€29) (2,14.55,€74) (3,3.98,€16) (4,26.24,€55) (5,63.69,€52)
(6,76.25,€75) (7,60.02,€74) (8,93.18,€35) (9,89.95,€78)
56 : (1,90.72,€13) (2,33.80,€40) (3,43.15,€10) (4,37.97,€16) (5,46.81,€36)
(6,48.77,€79) (7,81.80,€45) (8,19.36,€79) (9,6.76,€64)
```

## Output
The `pack` api outputs a `Promise<string>`, where each row is the `index of set of items` that you put into a package.
```
4
-
2,7
8,9
```

## Example
A text file `/path/to/file/example.txt`

```
import Packer from 'packer';

Packer.pack('/path/to/file/example.txt')
    .then((result) => {
        console.log(result);
    })
    .catch((err) => {
        console.log(err);
    });
```

## Library Setup
### Local
- cd to project folder
- run `npm install`
- run `npm run build`
- run `npm link`

- cd to the project that wants to use this library
- run  `npm link packer`
- import the `Packer` to use.

### NPM
- ensure you have a [npm](https://www.npmjs.com/) account
- cd to project folder
- run `npm install`
- run `npm run build`
- run `npm login` and login with your credentials
- run `npm publish`.
- confirm the publish on npm

now you can install the library in any project you want.

## Algorithm
The package problem is similar to the classic [`0\1 knapsack`](https://en.wikipedia.org/wiki/Knapsack_problem) problem. It seeks to maximize the available weight/capacity of the package while also maximizing cost.
The approach taken to solve this problem is the `Dynamic Programming with Memoization`, because there are a lot of overlapping sub-problems when trying out different combinations of items., hence, the need for `memoization` to store the result of sub-problems and avoid verbose or repeated computations. This greatly reduces the time complexity of the solution.
