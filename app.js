const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.set("strictQuery", false);
require('dotenv').config({path: '.env'});
// mongoose.connect("mongodb://localhost:27017/todolistDB");
const MONGODB_ATLAS = process.env.MONGODB_ATLAS;
mongoose.connect(MONGODB_ATLAS);

//Creamos un schema el cual será usado para crear el modelo
const itemsSchema = {
  name: {
    type: String,
    required: [true, "Olvidaste el nombre del item."]
  }
};

// Creamos un nuevo modelo para la bd
const Item = mongoose.model("Item", itemsSchema);

//Creamos documentos
const task1 = new Item({ name: "Bienvenido a tu lista de quehaceres" });
const task2 = new Item({ name: "Apreta el + para agregar una nueva tarea" });
const task3 = new Item({ name: "<- Apreta aquí para eliminar una tarea" });

const defaultTasks = [task1, task2, task3];

const listSchema = {
  name: {
    type: String,
    required: [true, "Olvidaste el nombre de la lista."]
  },
  items: [itemsSchema]
};
const List = mongoose.model("List", listSchema)


app.get("/", (req, res) => {
  // Buscamos todos los documentos existentes en la bd
  Item.find({}, (err, results) => {
    //Si no existen documentos entonces creamos los defaultTasks
    if (results.length === 0) {
      // Insertamos los documentos a la bd
      Item.insertMany(defaultTasks, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Los documentos fueron cargados exitosamente");
        }
      });
      //Redirigimos para que nos muestre los documentos ingresados a la bd
      //y así entre en el else
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: results });
    }
  });
});

app.post("/", (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({ name: itemName });
  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name:listName}, (err, foundList) =>{
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    })
  }
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (err) { 
        console.log(err); 
      } else { 
        console.log("Eliminado correctamante"); 
        res.redirect("/") 
      };
    });
  }else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err, foundList) =>{
      if (!err){
        res.redirect("/"+listName);
      }
    });
  }

});

app.get("/:customListName", (req, res) =>{
  const listName = _.capitalize(req.params.customListName);
  List.findOne({name: listName}, (err, foundList) =>{
    if (!err){
      if (!foundList){
        //Creamos una lista nueva
        const list = new List({
          name: listName,
          items: defaultTasks
        });
        list.save();
        res.redirect("/"+listName);
      }else{
        //Mostrar una nueva lista
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
})

app.get("/about", (req, res) => {
  res.render("about");
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
