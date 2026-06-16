const app = require("./app");
const { env  } = require("./config/env");

app.listen(env.PORT, () => {
    console.log(`Server is running on env  ${env.NODE_ENV} at port ${env.PORT}`);
});