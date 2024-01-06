const express = require('express');
const router = express.Router({ mergeParams: true });
const mongoHelper = require('../connections/mongo');
const asyncModule = require('async');
const _ = require('lodash');
const fs = require('fs').promises;
const csvtojson = require("csvtojson/v2");
const uuid = require('uuid').v4;
const FilesHelper = require('../modules/files');
const moment = require("moment");

module.exports = () => {
  router.get('/ping', (req, res) => {
    return res.json({ status: 200, message: "mongodb pong" });
  })

  router.get('/files', async (req, res, next) => {
    const db = await mongoHelper.getConnection().catch(next);
    req.query.parentId = req.query.parentId || "100";
    return asyncModule.parallel({
      parent: (cb) => {
        db
          .collection("FileMetaData")
          .findOne({ inode: req.query.parentId }, (err, parent) => {
            if (err) return cb(err);
            return cb(null, parent);
          })
      },
      files: (cb) => {
        const filter = {};
        if (req.query.parentId) filter.parentInode = req.query.parentId;
        db
          .collection("FileMetaData")
          .find(filter)
          .toArray((err, files) => {
            if (err) return cb(err);
            return cb(null, files);
          })
      }
    }, (err, results) => {
      if (err) return next(err);
      return res.status(200).json({ status: 200, ...results });
    })
  })

  router.post('/file', async (req, res, next) => {
    const { fileName, parentId = 100, partitionOn } = req.body;
    if (!req.files) return next({ status: 400, message: "File is required." });
    const file = req.files[0];

    if (!fileName) return next({ status: 400, message: "File name is required." });
    if (!file) return next({ status: 400, message: "File is required." });
    if (!partitionOn) return next({ status: 400, message: "Partition on is required." });

    const extension = file.mimetype.split("/")[1];
    if (!["csv", "json"].includes(extension)) return next({ status: 400, message: "Only json or csv allowed." });

    const fileContent = extension === "json" ? JSON.parse(await fs.readFile(file.path)) : await csvtojson().fromFile(file.path);
    const groups = _.groupBy(fileContent, partitionOn);
    if (_.size(groups) === 1 && groups[undefined]) return next({ status: 400, message: "Partition column not found." });

    const fileColumns = _.uniq(_.flatten(fileContent.map(Object.keys)));

    const db = await mongoHelper.getConnection().catch(next);
    const parentData = await db.collection("FileMetaData").findOne({ inode: parentId });
    if (!parentData) return next({ status: 400, message: "Parent not found." });

    const { size, type = 1 } = file;
    const inode = uuid();
    return asyncModule.parallel({
      fileMetaData: (cb) => {
        db
          .collection("FileMetaData")
          .insertOne({
            inode,
            name: fileName,
            size,
            type,
            parentInode: parentId,
            partitionedOn: partitionOn,
            createdAt: new Date(),
            extension,
            path: `${parentData.path}${parentData.inode}/`,
            fileColumns
          })
          .then((result) => {
            console.log("File metadata created:", result);
            return cb(null, result.insertedId);
          })
          .catch(cb);
      },
      fileData: (cb) => {
        const fileData = [];
        _.forEach(groups, (data, partitionValue) => {
          data = data.map(row => {
            return Object.keys(row).reduce((acc, key) => {
              return { ...acc, [key]: +row[key] == row[key] ? +row[key] : row[key] }
            }, {});
          })
          fileData.push({
            blockId: uuid(),
            inode,
            partitionValue,
            data
          })
        })
        db
          .collection("FileData")
          .insertMany(fileData)
          .then((result) => {
            console.log("All blocks inserted:", result);
            return cb(null, result);
          })
          .catch(cb);
      },
      updateSize: (cb) => {
        const parents = `${parentData.path}${parentData.inode}/`.split("/").filter(el => el.length);
        db
          .collection("FileMetaData")
          .updateMany({
            inode: { $in: parents }
          }, {
            $inc: { size }
          })
          .then((result) => {
            return cb(null, result);
          })
          .catch(cb);
      }
    }, (err, results) => {
      if (err) return next(err);
      return res.status(200).json({ status: 200, message: "File added successfully." });
    })
  });

  router.post("/folder", async (req, res, next) => {
    const { name, parentId = "100", size = 0, type = 0 } = req.body;
    if (!name) return next({ status: 400, message: "Folder name is required." });

    const db = await mongoHelper.getConnection().catch(next);
    const parentData = await db.collection("FileMetaData").findOne({ inode: parentId });
    if (!parentData) return next({ status: 400, message: "Parent not found." });
    const inode = uuid();
    return db
      .collection("FileMetaData")
      .insertOne({
        inode,
        name,
        size,
        type,
        parentInode: String(parentId),
        createdAt: new Date(),
        path: `${parentData.path}${parentData.inode}/`
      })
      .then((result) => {
        return res.status(200).json({ status: 200, message: "Folder added successfully." });
      })
      .catch(err => {
        if (err.code === 11000) return next({ status: 400, message: "Folder already exists." });
        return next(err);
      })
  })

  router.delete("/file/:inode", async (req, res, next) => {
    const { inode } = req.params;

    const db = await mongoHelper.getConnection().catch(next);

    const fileData = await db.collection("FileMetaData").findOne({ inode });
    if (!fileData) return next({ status: 404, message: "File not found." });
    if (fileData.type === 0) return next({ status: 400, message: "Folder can not be deleted." });
    const { size } = fileData;

    return asyncModule.parallel({
      fileMetaData: (cb) => {
        db
          .collection("FileMetaData")
          .findOneAndDelete({ inode }, (err, result) => {
            if (err) return cb(err);
            return cb(null, result);
          })
      },
      fileData: (cb) => {
        db
          .collection("FileData")
          .deleteMany({ inode }, (err, result) => {
            if (err) return cb(err);
            return cb(null, result);
          })
      },
      updateSize: (cb) => {
        const parents = `${fileData.path}${fileData.inode}/`.split("/").filter(el => el.length);
        db
          .collection("FileMetaData")
          .updateMany({
            inode: { $in: parents }
          }, {
            $inc: { size: -size }
          })
          .then((result) => {
            console.log("result of update size:", result);
            return cb(null, result);
          })
          .catch(cb)
      }
    }, (err, results) => {
      if (err) return next(err);
      return res.status(200).json({ status: 200, message: "File deleted successfully." });
    })
  })

  router.get("/cat/:inode", async (req, res, next) => {
    const { inode } = req.params;
    const db = await mongoHelper.getConnection().catch(next);

    const fileData = await db.collection("FileMetaData").findOne({ inode });
    if (!fileData) return next({ status: 400, message: "File not found." });
    if (fileData.type !== 1) return next({ status: 400, message: "Not a file." });

    return db
      .collection("FileData")
      .find({ inode })
      .toArray((err, result) => {
        if (err) return next(err);
        return res.status(200).json({ status: 200, fileName: fileData.name, parentInode: fileData.parentInode, data: _.shuffle(_.flatten(result.map(el => el.data))) });
      })
  })

  router.get("/getPartitions/:inode", async (req, res, next) => {
    const { inode } = req.params;

    return FilesHelper
      .mongoGetPartitions(inode)
      .then(result => res.status(200).json({ status: 200, ...result }))
      .catch(next);
  })

  router.get("/getPartition/:blockId", async (req, res, next) => {
    const { blockId } = req.params;

    return FilesHelper.mongoGetPartition(blockId)
      .then(result => res.status(200).json({ status: 200, partitionData: result.data }))
      .catch(next);
  })

  router.get("/columns/:inode", async (req, res, next) => {
    const { inode } = req.params;
    const db = await mongoHelper.getConnection().catch(next);

    const fileData = await db.collection("FileMetaData").findOne({ inode });

    if (!fileData) return next({ status: 400, message: "File not found." });
    if (!fileData.type === 0) return next({ status: 400, message: "Cannot get columns of a directory." });

    return res.status(200).json({ status: 200, ...fileData })
  })

  router.get("/search/:inode/:column", async (req, res, next) => {
    const { inode, column } = req.params;

    const { operator = "===" } = req.query;
    let { searchValue = null, from = null, to = null } = req.query;
    searchValue = +searchValue == searchValue ? +searchValue : searchValue;
    from = +from == from ? +from : from;
    to = +to == to ? +to : to;
    console.log("serachValue:", searchValue, typeof (searchValue), "from:", from, typeof (from), "to:", to, typeof (to));

    const functions = {
      "===": (a, b) => a === b,
      "<": (a, b) => a < b,
      ">": (a, b) => a > b,
      "<=": (a, b) => a <= b,
      ">=": (a, b) => a >= b,
      "between": (a, _, from, to) => a >= from && a <= to
    }
    const filters = {
      "===": { [`data.${column}`]: searchValue, inode },
      "<": { [`data.${column}`]: { $lt: searchValue }, inode },
      ">": { [`data.${column}`]: { $gt: searchValue }, inode },
      "<=": { [`data.${column}`]: { $lte: searchValue }, inode },
      ">=": { [`data.${column}`]: { $gte: searchValue }, inode },
      "between": { [`data.${column}`]: { $gte: from, $lte: to }, inode }
    }

    const { partitions } = await FilesHelper.mongoGetPartitions(inode, filters[operator]).catch(next);
    console.log("partitions:", partitions);
    return asyncModule.map(partitions, async partition => {
      const { data } = await FilesHelper.mongoGetPartition(partition.blockId, { ...filters[operator], blockId: partition.blockId }).catch(next);

      if (typeof (data[0][column]) === "string" && operator !== "===" && moment(data[0][column]).format() === "Invalid date") throw { status: 400, message: "Cannot have range/equality search on string columns." };

      let filteredData = [];
      if (operator === "between" && column === "timeStamp") {
        console.log("between and timestamp");
        filteredData = data.filter(row => moment(row[column]).isSameOrAfter(moment(from)) && moment(row[column]).isSameOrBefore(moment(to)));
      }
      else
        filteredData = data.filter(row => functions[operator](row[column], searchValue, from, to));
      return filteredData;
    }, (err, results) => {
      console.log("Error in search in mongo:", err);
      if (err) return next({ status: err.status || 500, message: err.message || "Error searching file." });
      results = _.flatten(results);
      if (!results.length) return next({ status: 404, message: "No results found." });
      return res.status(200).json({ status: 200, searchResults: results });
    })
  })

  router.get("/analytics/:inode/:column", async (req, res, next) => {
    const { inode, column } = req.params;
    let { aggregate, partitionValue, isMonthWise = partitionValue && partitionValue === "*" } = req.query;
    if (!aggregate || !partitionValue) throw next({ status: 400, message: "Aggregate and period are required." });

    console.log("isMonthWise:", isMonthWise);
    let filters = { inode, partitionValue };
    if (isMonthWise) filters = null;

    const functions = {
      "sum": (a, b) => a + b,
      "min": (a, b) => Math.min(a, b),
      "max": (a, b) => Math.max(a, b),
    }
    const defaults = {
      "sum": 0,
      "min": Infinity,
      "max": -Infinity
    }

    const { partitions } = await FilesHelper.mongoGetPartitions(inode, filters).catch(next);
    console.log("partitions:", partitions);
    return asyncModule.map(partitions, async partition => {
      let { data } = await FilesHelper.mongoGetPartition(partition.blockId, filters).catch(next);

      if (typeof (data[0][column]) === "string" && aggregate !== "count") throw { status: 400, message: "Cannot have aggregate search on string columns." };

      if (functions[aggregate])
        data = { period: partition.partitionValue, value: data.reduce((acc, row) => functions[aggregate](acc, row[column]), defaults[aggregate]) };
      else if (aggregate === "count")
        data = { period: partition.partitionValue, value: data.length }
      else if (aggregate === "avg")
        data = { sum: data.reduce((acc, row) => acc + row[column], 0), count: data.length, period: partition.partitionValue };
      return data;
    }, (err, results) => {
      if (err) return next({ status: err.status || 500, message: err.message || "Error searching file." });
      console.log("results:", results, aggregate);
      if (isMonthWise) {
        if (aggregate === "avg") {
          results = results.map(result => {
            result.value = result.sum / result.count;
            delete result.sum;
            delete result.count;
            return result;
          })
        }
        return res.status(200).json({ status: 200, analytics: results });
      }

      if (functions[aggregate])
        results = results.reduce((acc, row) => functions[aggregate](acc, row.value), defaults[aggregate]);
      else if (aggregate === "count")
        results = results.reduce((acc, row) => acc + row.value, 0);
      else if (aggregate === "avg") {
        results = { sum: results.reduce((acc, row) => acc + row.sum, 0), count: results.reduce((acc, row) => acc + row.count, 0) };
        results = results.sum / results.count;
      }
      console.log("After merging:", results);
      return res.status(200).json({ status: 200, analytics: results });
    })
  });

  router.get("/restore-everything", async (req, res, next) => {
    await FilesHelper.restoreAllFiles().catch(next);
    return res.status(200).json({ status: 200, message: "Restored everything." });
    // create root folder
  });

  return router;
}