const Car = require("../models/car");
const User = require("../models/user");
const _ = require("lodash");
const fs = require("fs").promises;
const stream = require("stream");
const { google } = require("googleapis");

const mongoose = require("mongoose");
const Grid = require("gridfs-stream");
const connection = require("../database/db");

let gfs;
connection();

const conn = mongoose.connection;
conn.once("open", function () {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection("photos");
});

require("dotenv").config();

// const CLIENT_ID = process.env.GOOGLECLIENTID;
// const CLIENT_SECRET = process.env.GOOGLECLIENTSECRET;
// const REDIRECT_URI = "https://autolist.co.ke/api";

// const REFRESH_TOKEN = process.env.GOOGLE_REFRESHTOKEN;

// const oauth2Client = new google.auth.OAuth2(
//     CLIENT_ID,
//     CLIENT_SECRET,
//     REDIRECT_URI
// );

// oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

// const drive = google.drive({
//     version: "v3",
//     auth: oauth2Client,
// });

module.exports = {
    index: async (req, res, next) => {
        //Get all the cars
        const cars = await Car.find({ $and: [{ status: "active" }] });

        res.status(200).json(cars);
    },

    getTrendingCars: async (req, res, next) => {
        //Get all the cars
        var cars = await Car.find({ $and: [{ status: "active" }] });

        cars.sort((a, b) => parseFloat(b.views) - parseFloat(a.views));

        cars = cars.sort(function (a, b) {
            var c = new Date(a.createdAt);
            var d = new Date(b.createdAt);
            return c - d;
        });

        res.status(200).json(cars);
    },

    getFeaturedCars: async (req, res, next) => {
        //Get all the cars
        var cars = await Car.find({ $and: [{ status: "active" }] });

        cars.sort((a, b) => parseFloat(a.views) - parseFloat(b.views));

        cars = cars.sort(function (a, b) {
            var c = new Date(a.createdAt);
            var d = new Date(b.createdAt);
            return d - c;
        });

        res.status(200).json(cars);
    },

    getCarImage: async (req, res) => {
        try {
            console.log("Request", req.params.filenam);
            const file = await gfs.files.findOne({
                filename: req.params.filename,
            });
            const readStream = gfs.createReadStream(file.filename);
            readStream.pipe(res);
        } catch (error) {
            res.send("not found");
        }
    },

    getAdminCars: async (req, res, next) => {
        //Get all the cars
        const cars = await Car.find().select(
            "_id name make model year body condition transmission duty sold verified featured mileage price priceNegotiable fuel interior color engineSize description features location seller images status views"
        );

        res.status(200).json(cars);
    },

    // postCarImages: async (req, res) => {
    //     console.log("Response", req.files);
    // },

    // postCarImages: async (req, res, next) => {
    //     if (!req.files) {
    //         res.send({ status: false, message: "No file uploaded" });
    //     } else {
    //         const { carId } = req.value.params;
    //         const carObject = await Car.findById(carId);

    //         //loop all files

    //         for await (const imageFile of req.files.photos) {
    //             const photo = imageFile;
    //             let fileId = "";
    //             const currentPhotoName =
    //                 Date.now() + photo.name.replace(/\s/g, "");
    //             const bufferStream = new stream.PassThrough();
    //             bufferStream.end(photo.data);
    //             try {
    //                 const response = await drive.files.create({
    //                     requestBody: {
    //                         name: currentPhotoName, //This can be name of your choice
    //                         mimeType: photo.mimetype,
    //                     },
    //                     media: {
    //                         mimeType: photo.mimetype,
    //                         body: bufferStream,
    //                     },
    //                 });

    //                 fileId = response.data.id;
    //                 await drive.permissions.create({
    //                     fileId: fileId,
    //                     requestBody: {
    //                         role: "reader",
    //                         type: "anyone",
    //                     },
    //                 });
    //             } catch (error) {
    //                 console.log(error.message);
    //             }
    //             const url = process.env.GOOGLE_DRIVE_URI;
    //             const image = url + fileId;
    //             console.log("id", image);
    //             carObject.images.push(image);
    //         }
    //         await carObject.save();
    //         const message = "Car Details and Images uploaded successfuly";
    //         res.status(200).json({ carObject, message });
    //     }
    // },

    // postCarImages: async (req, res, next) => {
    //   if (!req.files) {
    //     res.send({ status: false, message: "No file uploaded" });
    //   } else {
    //     const { carId } = req.value.params;
    //     const carObject = await Car.findById(carId);

    //     const url = process.env.FILES_URI;
    //     //loop all files
    //     if (req.files.photos instanceof Array) {
    //       _.forEach(_.keysIn(req.files.photos), (key) => {
    //         const photo = req.files.photos[key];
    //         const currentPhoto = Date.now() + photo.name.replace(/\s/g, "");
    //         photo.mv("./uploads/" + currentPhoto);
    //         const image = url + "/uploads/" + currentPhoto;
    //         carObject.images.push(image);
    //       });
    //     } else {
    //       const photo = req.files[Object.keys(req.files)[0]];
    //       const currentPhoto = Date.now() + photo.name;
    //       photo.mv("./uploads/" + currentPhoto);
    //       const image = url + "/uploads/" + currentPhoto;
    //       console.log(image)
    //       carObject.images.push(image);
    //       console.log(carObject.images.length);
    //     }

    //     //return response
    //     await carObject.save();
    //     const message = "Car Details and Images uploaded successfuly";
    //     res.status(200).json({ carObject, message });
    //   }
    // },

    postCarImages: async (req, res, next) => {
        console.log("Files", req.files)
        if (!req.files) {
            res.send({ status: false, message: "No file uploaded" });
        } else {
            const { carId } = req.value.params;
            const carObject = await Car.findById(carId);
            const url = process.env.FILES_URI;
            for (let x = 0; x < req.files.length; x++) {
                let image = url + req.files[x].filename;
                console.log(url + req.files[x].filename);
                carObject.images.push(image);
            }

            //return response
            await carObject.save();
            const message = "Car Details and Images uploaded successfuly";
            res.status(200).json({ carObject, message });
        }
    },

    deleteCarImage: async (req, res, next) => {
        const { carId } = req.value.params;
        const carObject = await Car.findById(carId);
        const { imageUrl } = req.body;

        const imageExist = carObject.images.includes(imageUrl);
        if (!imageExist) {
            const message = "Image does not exist";
            return res.status(200).json({
                message,
            });
        }

        const lastSegment = imageUrl.split("/").pop(); // handle potential trailing slash
        await fs.unlink("./uploads/" + lastSegment);

        await carObject.images.pull(imageUrl);
        //console.log(url.pathname);

        //return response
        const message = "Car image deleted successfuly";
        await carObject.save();
        res.status(200).json({ message });
    },

    featureCar: async (req, res, next) => {
        const { carId } = req.value.params;
        var date = new Date();
        const nowDate = new Date(); // Now
        date.setDate(date.getDate() + 30);
        await Car.findByIdAndUpdate(carId, {
            "featured.startDay": nowDate,
            "featured.endDay": date,
            "featured.featuredCarPackage.packageName": req.body.packageName,
            "featured.featuredCarPackage.packagePrice": req.body.packagePrice,
        });
        const message = "Completed Successfully";
        res.status(200).json({ message });
    },

    approveCar: async (req, res, next) => {
        const { carId } = req.value.params;
        const car = await Car.findById(carId);
        if (!car) {
            const message = "Car Does Not Exist";
            return res.status(200).json({
                message,
            });
        }
        await Car.findByIdAndUpdate(carId, {
            status: "active",
        });

        const message = "Car Approved Successfully";
        res.status(200).json({
            message,
        });
    },

    declineCar: async (req, res, next) => {
        const { carId } = req.value.params;
        const car = await Car.findById(carId);
        if (!car) {
            const message = "Car Does Not Exist";
            return res.status(200).json({
                message,
            });
        }
        await Car.findByIdAndUpdate(carId, {
            status: "declined",
        });

        const message = "Car Declined Successfully";
        res.status(200).json({
            message,
        });
    },

    deleteCar: async (req, res, next) => {
        const { carId } = req.value.params;
        //Get Car
        const car = await Car.findById(carId);
        if (!car) {
            const message = "Car Does Not Exist";
            return res.status(404).json({
                message,
            });
        }
        const sellerId = car.seller.sellerID;
        //Get Seller
        const seller = await User.findById(sellerId);

        //Remove car

        // images.forEach(function (filename) {
        //   var url = new URL(images[i]);
        //   fs.unlink(filename);
        // });
        const images = car.images;
        for (i = 0; i < images.length; i++) {
            console.log("Image to delete", images[i]);
            let imageUrl = images[i]
            let imageName = imageUrl.replace("http://localhost:5000/cars/carPhoto/", "");
            try {
                await gfs.files.deleteOne({ filename: imageName });
                // res.send("success");
            } catch (error) {
                console.log(error);
                // res.send("An error occured.");
            }
            console.log("Image to deleted",imageName);
        }

        await car.remove();
        await seller.cars.pull(carId);
        //Remove car from the seller list

        await seller.save();
        const message = "Car Deleted Successfully";
        res.status(200).json({
            message,
        });
    },

    carSold: async (req, res, next) => {
        const { carId } = req.value.params;
        const car = await Car.findById(carId);
        if (!car) {
            const message = "Car Does Not Exist";
            return res.status(200).json({
                message,
            });
        }
        await Car.findByIdAndUpdate(carId, {
            status: "sold",
        });

        const message = "Car Sold Successfully";
        res.status(200).json({ message });
    },

    updateCar: async (req, res, next) => {
        const { carId } = req.value.params;
        console.log("Status", carId);
        var carObject = await Car.findById(carId);
        if (!carObject) {
            const message = "Car Does Not in Existence";
            return res.status(200).json({
                message,
            });
        }
        var status = carObject.status;
        carObject = req.value.body;
        carObject.status = "underreview";

        await Car.findByIdAndUpdate(carId, carObject);
        //  if(updatedCar.status == "declined"){
        //    updatedCar.status = "underreview"
        //    await updatedCar.save()
        //  }

        const message = "Car Edited Successfully";
        res.status(200).json({ carObject, message });
    },

    newCar: async (req, res, next) => {
        console.log("req.value", req.value);
        //Find the actual seller
        const seller = await User.findById(req.value.body.seller).select(
            "_id name email cars"
        );
        //Creat a new car
        const newCar = req.value.body;
        newCar.seller = seller;
        const car = new Car(newCar);
        await car.save();
        // Add new created car to actual selller
        seller.cars.push(car);
        await seller.save();
        //Were done
        res.status(200).json(car);
    },

    getCar: async (req, res, next) => {
        const carObject = await Car.findById(req.value.params.carId);
        if (!carObject) {
            const message = "This car does not exist";
            return res.status(200).json({ message });
        }
        const message = "Car found";
        res.status(200).json({ carObject, message });
    },

    // getFeaturedCars: async (req, res, next) => {
    //   const data = await Car.find().sort('createdAt');
    //   console.log(data);
    //   res.status(200).json({ data });
    // },

    carViewed: async (req, res, next) => {
        const carId = req.value.params.carId;
        const carObject = await Car.findByIdAndUpdate(
            { _id: carId },
            { $inc: { views: 1 } }
        );
        if (!carObject) {
            const message = "This car does not exist";
            return res.status(200).json({ message });
        }
        const message = "Car Viewed";
        res.status(200).json({ message });
    },

    replaceCar: async (req, res, next) => {
        const { carId } = req.value.params;
        const newCar = req.value.body;
        const result = await Car.findByIdAndUpdate(carId, newCar);
        res.status(200).json({ success: true });
    },
};
