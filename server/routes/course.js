var express = require('express');
var router = express.Router();
var formidable = require('formidable');
var fs = require('fs');
var mongoose = require('mongoose')
var path = require('path')
var googleStorage = require('./../config')

const Course = require('./../models/Course')
const User = require('./../models/User')



// GET COURSES
router.get('/', (req, res) => {
  Course.find()
  .then(data => res.json(data))
  .catch(error => res.status(500).res.json({err: 'No courses found'}))
});


// GET SINGLE COURSE
router.get('/:courseId', (req, res) => {
  let courseId = req.params.courseId;

  Course.findById(courseId)
  .then(data => res.json(data))
  .catch(err => res.status(500).json({error: 'Something failed'}))

});



// DELETE COURSE
router.delete('/delete/:courseId', (req, res) => {
  let courseId = req.params.courseId;

  Course.findOneAndDelete({ _id: courseId })
  .then(data => res.json(data))
  .catch(error => res.status(500).res.json({error: 'Could not delete course'}))

});


// DELETE FILE
router.delete('/deleteFile/:courseId/:fileId', (req, res) => {
  let courseId = req.params.courseId
  let fileId = req.params.fileId;

  Course.findById(courseId)
  .then(courseData => {
    let files = courseData.filePaths
    let path = files.find(element => element._id == fileId).path

    googleStorage.storage.bucket(googleStorage.bucketName).file(path).delete().then(() => {
          Course.findByIdAndUpdate( courseId, { $pull: { "filePaths": { _id: fileId } } },{new: true})
          .then(data => res.json(data))
          .catch(error => res.status(500).res.json({error: 'Could not update Course file'}))
    })
    .catch(err => console.log(err))
  })
  .catch(error => res.status(500).res.json({error: 'Could not delete file'}))


});



// DELETE VIDEO
router.delete('/deleteVideo/:courseId/:videoId', (req, res) => {
  let courseId = req.params.courseId
  let videoId = req.params.videoId
  let youtubeId = req.params.youtubeId

  Course.findById(courseId)
  .then(courseData => {

    Course.findByIdAndUpdate( courseId, { $pull: { "videos": { _id: videoId } } },{new: true})
    .then(data => res.send(data))
    .catch(error => res.status(500).res.json({error: 'Could not update video file'}))

  })
  .catch(error => res.status(500).res.json({error: 'Could not delete video'}))

});



// UPLOAD VIDEO
router.post('/uploadVideo', (req, res) => {
  let courseId = req.body.courseId
  let url = req.body.url
  let title = req.body.title
  let youtubeId = req.body.youtubeId
  let thumbnail = req.body.thumbnail

  Course.findById(courseId)
  .then(courseObj => {
    let videos = courseObj.videos
    let findUrl = videos.findIndex(element => element.title === title)

    if (findUrl == -1) {
      Course.findByIdAndUpdate(courseId, {"$push": { "videos": {title, url, youtubeId, thumbnail, clicks: 0}}} , {new: true})
      .then(data => res.send(data))
      .catch(error => res.status(500).res.json({error: 'Could not update video data'}))
    }

  })
  .catch(error => res.status(500).res.json({error: 'Could not upload video'}))

});





// DONWLOAD FILE
router.get('/downloadFile/:downloadName', (req, res) => {
  let downloadName = req.params.downloadName
  let publicPath = `${__dirname}/../public/${downloadName}`
  let options = { destination: `./public/${downloadName}`}

  googleStorage.storage.bucket(googleStorage.bucketName).file(downloadName).download(options)
  .then(() => res.download(publicPath, downloadName))
  .catch(err => console.error('ERROR:', err));

});




// UPLOAD FILE
router.post("/uploadFile", (req, res) => {

  var form = new formidable.IncomingForm();
  form.parse(req, (error,fields,files) => {
    let oldPath = files.file.path;
    let courseId = fields.courseId
    let newName = `${courseId}_${files.file.name}`


    Course.findById(courseId)
    .then(courseObj => {
      let filePaths = courseObj.filePaths
      let findName = filePaths.findIndex(element => element.path == newName)
      if (findName == -1) {

        googleStorage.storage.bucket(googleStorage.bucketName).upload(oldPath).then(data => {
          let fileName = data[0].name
          googleStorage.storage.bucket(googleStorage.bucketName).file(fileName).move(newName).then(() => {

            Course.findByIdAndUpdate(courseId, {"$push": { "filePaths": {fileName: files.file.name, path: newName}}} , {new: true})
            .then(data => res.json(data))
            .catch(error => res.status(500).res.json({error: 'Could not update file'}))

          })
        }).catch(err => console.error('ERROR:', err))

      }

    })
    .catch(error => res.status(500).res.json({error: 'Could not upload file'}))

  })

});





// UPDATE COURSE
router.post("/update", (req, res) => {

  let obj = req.body;

  Course.findByIdAndUpdate(obj._id,{
    name: obj.name,
    dateFrom: obj.dateFrom,
    dateTo: obj.dateTo,
    description: obj.description,
    courseStatus: obj.courseStatus
  }, {new: true})
  .then(data => res.send(data))
  .catch(error => res.status(500).res.json({error: 'Could not upload file'}))

});




// ENROLL COURSE
router.post('/enrollCourse', (req, res) => {
  let courseId = req.body.courseId
  let userId = req.body.userId



  Course.findById(courseId)
  .then(courseObj => {
    let members = courseObj.members
    let findMember = members.findIndex(element => element.userId === userId)

    if (findMember == -1) {
      Course.findByIdAndUpdate(courseId, {"$push": { "members": {userId: userId}}} , {new: true})
      .then(data => res.send(data))
      .catch(error => res.status(500).res.json({error: 'Could not update course '}))
    }

  })
  .catch(error => res.status(500).res.json({error: 'Could not enroll in course '}))


});





// LEAVE COURSE
router.delete('/leaveCourse/:courseId/:enrollId', (req, res) => {
  let courseId = req.params.courseId
  let enrollId = req.params.enrollId


  Course.findById(courseId)
  .then(courseData => {
    Course.findByIdAndUpdate( courseId, { $pull: { "members": { _id: enrollId } } },{new: true})
    .then(data => res.send(data))
    .catch(error => res.status(500).json({error: 'Could not update '}))

  })
  .catch(error => res.status(500).json({error: 'Could not find course '}))


});



// CREATE COURSE
router.post('/create', (req, res) => {

  const course = new Course();
  const obj = req.body;

  Object.keys(obj).forEach(key => {
    let value = obj[key]
    course[key] = value
  });

  course.save()
  .then(data => res.send(data))
  .catch(error => res.status(500).res.json({error: 'Could not create course '}))


});




// export default router
module.exports = router
