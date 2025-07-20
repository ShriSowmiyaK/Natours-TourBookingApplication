const express = require("express");
const router = express.Router();
const { aliasTopTours, getAllTours, createTour, getSingleTour, updateTour, deleteTour, getStats, getMonthlyPlan } = require("../controllers/tourController");
const authController = require("./../controllers/authController");

//aliasing
router.route("/top-5-tours").get(aliasTopTours, getAllTours);
router.route("/top-stats").get(getStats);
router.route("/monthly-plan/:year").get(getMonthlyPlan);


router.route("/")
    .get(authController.protect, getAllTours)
    .post(createTour);
router.route("/:id")
    .get(getSingleTour)
    .patch(updateTour)
    .delete(authController.protect, authController.restrictTo("admin", "lead-guide"), deleteTour);
module.exports = router;
