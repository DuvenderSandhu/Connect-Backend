try {
    let result = await connectToMongo();
    let user = await jwt.verify(req.body.token, JWT_SECRET);
    if (user) {
      let my_data = await User.find({ username: user.username }).select([
        "-password",
        "-email",
      ]);
      if (my_data[0].info.friends.length === 0) {
        res.send("You Have No Friends");
      } else if (my_data[0].info.friends.indexOf(req.params.username) >= 0) {
        let chat = await Msg.find({
          between: [
            user.username.toLowerCase(),
            req.params.username.toLowerCase(),
          ],
        });
        
        } else {
          res.json({ alert: "You are not friends " });
        }
      } 
      else {
        res.send(chat);
      }
    }
  } catch {
    res.send("Something Went Wrong");
  }