import app from "./app.js";
import { connectDB } from "./config/database.js";


const port = process.env.PORT || 5000;

async function main() {
  try {
    await connectDB();

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.log(error);
  }
}

main();