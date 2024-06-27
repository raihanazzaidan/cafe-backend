const express = require("express")
const bodyParser = require("body-parser")
const cors = require("cors")
const mysql = require("mysql")
const moment = require("moment")
const md5 = require('md5')
const Cryptr = require("cryptr")
const crypt = new Cryptr("123")
const multer = require("multer")

const app = express()
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "kafe"
})

db.connect(error => {
    if(error) {
        console.log(error.message)
    }else{
        console.log("Connected Database kopi")
    }
})

validateToken = () => {
    return (req, res, next) => {
        if(!req.get("Token")) {
            res.json({
                message: "Access Forbidden"
            })
        } else{
            let token = req.get("Token")
            let decryptToken = crypt.decrypt(token)
            let sql = "select * from admin where ?"
            let param = { id: decryptToken}

            db.query(sql, param, (error, result) => {
                if(error) throw error
                    if(result.length > 0){
                        next()
                    } else{
                        res.json({
                            message: "Invalid Token"
                        })
                    }
            })
        }
    }
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'image/');
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    }
  });

  app.post("/admin/auth", (req,res) => {
    let param = [
        req.body.email,
        md5(req.body.password) 
    ]

    let sql = "select * from admin where email = ? and password = ?"

    db.query(sql, param, (error, result) => {
        if(error) throw error

        if(result.length > 0){
            res.json({
                message: "Logged",
                token: crypt.encrypt(result[0].id), 
                data: result
            })
        } else{
            res.json({
                message: "Invalid email/password"
            })
        }
    })
})

// get all admin
app.get("/admin", validateToken(), (req, res) => {
    let sql = "select * from admin"

    db.query(sql, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message 
            }            
        } else {
            response = {
                count: result.length, 
                admin: result 
            }            
        }
        res.json(response) 
    })
})

// get admin from id
app.get("/admin/:id", validateToken(), (req, res) => {
    let data = {
        id: req.params.id
    }
    let sql = "select * from admin where ?"

    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message
            }            
        } else {
            response = {
                count: result.length,
                admin: result 
            }            
        }
        res.json(response)
    })
})

// add admin
app.post("/admin", validateToken(), (req,res) => {

    let data = {
        name: req.body.name,
        email: req.body.email,
        password: md5(req.body.password),
        createdAt: moment().format('YYYY-MM-DD HH:mm:ss'),
        updatedAt: moment().format('YYYY-MM-DD HH:mm:ss')
    }

    let sql = "insert into admin set ?"

    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message
            }
        } else {
            response = {
                message: result.affectedRows + " data inserted"
            }
        }
        res.json(response) 
    })
})

// edit admin
app.put("/admin", validateToken(), (req,res) => {

    let data = [
        {
            id: req.body.id,
            name: req.body.name,
            email: req.body.email,
            password: md5(req.body.password)
        },

        {
            id: req.body.id
        }
    ]

    let sql = "update admin set ? where ?"

    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message
            }
        } else {
            response = {
                message: result.affectedRows + " data updated"
            }
        }
        res.json(response) 
    })
})

// delete admin from id
app.delete("/admin/:id", validateToken(), (req,res) => {
    // prepare data
    let data = {
        id: req.params.id
    }

    // create query sql  delete
    let sql = "delete from admin where ?"

    
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message
            }
        } else {
            response = {
                message: result.affectedRows + " data deleted"
            }
        }
        res.json(response)
    })
})

// get all menu
app.get("/coffee", (req, res) => {

    let sql = "select * from coffee"

    db.query(sql, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message
            }            
        } else {
            response = {
                count: result.length, 
                coffee: result
            }            
        }
        res.json(response)
    })
})
app.get("/coffee/:search", (req, res) => {
    let data = {
        id: req.params.search 
    };
    // Buat query SQL
    let sql = "SELECT * FROM coffee WHERE ?";

    // Jalankan query
    db.query(sql, data, (error, result) => {
        let response = null;
        if (error) {
            response = {
                message: error.message // Pesan error
            };
        } else {
            response = {
                count: result.length, // Jumlah data
                coffee: result // Isi data
            };
        }
        res.json(response); // Kirim respons
    });
});

app.post("/coffee", validateToken(), (req, res) => {
    // Prepare data
    let data = {
        name: req.body.name,
        size: req.body.size,
        price: req.body.price,
        stok: req.body.stok,
        image: req.body.image,
        createdAt: moment().format('YYYY-MM-DD HH:mm:ss'),
        updatedAt: moment().format('YYYY-MM-DD HH:mm:ss')
    }

    // Create SQL query insert
    let sql = "INSERT INTO coffee SET ?";

    // Run query
    db.query(sql, data, (error, result) => {
        if (error) {
            res.status(500).json({ message: error.message }); // Send error response
        } else {
            res.json({ message: result.affectedRows + " data inserted" }); // Send success response
        }
    });
});

app.put("/coffee/", validateToken(), (req,res) => {
    let data = [
        {
            name: req.body.name,
            size: req.body.size,
            price: req.body.price,
            stok: req.body.stok,
            image: req.body.image
        },
        {
            id: req.body.id
        }
    ]

    // create sql query update
    let sql = "update coffee set ? where ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message
            }
        } else {
            response = {
                message: result.affectedRows + " data updated"
            }
        }
        res.json(response) // send response
    })
})

app.delete("/coffee/:id", validateToken(), (req,res) => {
    // prepare data
    let data = {
        id: req.params.id
    }

    // create query sql delete
    let sql = "delete from coffee where ?"

    
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message
            }
        } else {
            response = {
                message: result.affectedRows + " data deleted"
            }
        }
        res.json(response)
    })
})

app.post("/order", (req, res) => {
    const { customer_name, order_type, order_date, order_detail } = req.body;
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;
  
    // Insert order data into order_list table
    const insertOrderQuery = 'INSERT INTO order_list (customer_name, order_type, order_date, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)';
  
    db.query(insertOrderQuery, [customer_name, order_type, order_date, createdAt, updatedAt], (err, result) => {
      if (err) {
        console.error('Error: ' + err.stack);
        res.status(500).json({
          status: false,
          message: 'Failed to create order'
        });
        return;
      }
  
      const orderId = result.insertId;
  
      // Insert order details into order_detail table
      const insertOrderDetailQuery = 'INSERT INTO order_detail (order_id, coffee_id, price, qty) VALUES ?';
      const orderDetailsValues = order_detail.map(detail => [orderId, detail.coffee_id, detail.price, detail.qty]);
  
      db.query(insertOrderDetailQuery, [orderDetailsValues], (err, _) => {
        if (err) {
          console.error('Error:' + err.stack);
          res.status(500).json({
            status: false,
            message: 'Failed to create order details'
          });
          return;
        }
  
        // Response
        res.json({
          status: true,
          data: {
            id: orderId,
            customer_name: customer_name,
            order_type: order_type,
            order_date: order_date,
            createdAt: createdAt,
            updatedAt: updatedAt
          },
          message: 'Order list has created'
        });
      });
    });
  });

  app.get("/order", validateToken(), (req, res) => {
    let sql = "select * from order_list"

    db.query(sql, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message 
            }            
        } else {
            response = {
                count: result.length, 
                admin: result 
            }            
        }
        res.json(response) 
    })
})

app.listen(5959, () => {
    console.log("Run on port 5959")
})