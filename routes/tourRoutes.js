const express = require("express");
const router = express.Router();
const { aliasTopTours, getAllTours, createTour, getSingleTour, updateTour, deleteTour, getStats, getMonthlyPlan } = require("../controllers/tourController");
const authController = require("./../controllers/authController");
const reviewRouter = require("./reviewRoutes");

//mounting a router - reviewRouter itself is a middleware
router.use("/:tourId/reviews", reviewRouter);

//aliasing
router.route("/top-5-tours").get(aliasTopTours, getAllTours);
router.route("/top-stats").get(getStats);
router.route("/monthly-plan/:year").get(authController.protect, authController.restrictTo("admin", "lead-guide"), getMonthlyPlan);

router.route("/")
    .get(getAllTours)
    .post(authController.protect, authController.restrictTo("admin", "lead-guide"), createTour);
router.route("/:id")
    .get(getSingleTour)
    .patch(authController.protect, authController.restrictTo("admin", "lead-guide"), updateTour)
    .delete(authController.protect, authController.restrictTo("admin", "lead-guide"), deleteTour);
module.exports = router;
