import arcjet from "@arcjet/next";
import dotenv from "dotenv";

dotenv.config();
const arcjetClient = arcjet({
    key : process.env.ARCJET_KEY,
    rules : [],
});

export default arcjetClient;