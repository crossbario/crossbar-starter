console.log("Runnning on AutobahnJS ", autobahn.version);

// the URL of the WAMP Router (Crossbar.io)
//
var wsuri;
if (document.location.origin == "file://") {
   wsuri = "ws://127.0.0.1:8080/ws";

} else {
   wsuri = (document.location.protocol === "http:" ? "ws:" : "wss:") + "//" +
               document.location.host + "/ws";
}


// the WAMP connection to the Router
//
var connection = new autobahn.Connection({
   url: wsuri,
   realm: "realm1"
});


// timers
//
var t1, t2;


// fired when connection is established and session attached
//
connection.onopen = function (session, details) {

   console.log("Connected: ", session, details);

   var componentId = details.authid;
   var componentType = "JavaScript/Browser";

   console.log("Component ID is ", componentId);
   console.log("Component type is ", componentType);


   // SUBSCRIBE to a topic and receive events
   //

   function on_counter (args) {

      var counter = args[0];
      var id = args[1];
      var type = args[2];

      console.log("-----------------------");
      console.log("oncounter event, counter value: ",  counter);
      console.log("from component " + id + " (" + type + ")");

   }

   session.subscribe('com.example.oncounter', on_counter).then(

      function (sub) {
         console.log("-----------------------");
         console.log('subscribed to topic "com.example.oncounter"');
      },
      function (err) {
         console.log("-----------------------");
         console.log('failed to subscribe to topic', err);
      }

   );


   // PUBLISH an event every 2 seconds .. forever
   //
   var counter = 0;
   t1 = setInterval(function () {

      session.publish('com.example.oncounter', [
         counter,
         componentId,
         componentType
      ], {}, { exclude_me: false });
      // default for exclude_me is 'true' = publisher does not receive
      // its own publications as events

      console.log("-----------------------");
      console.log("published to topic 'com.example.oncounter'", counter);

      counter += 1;

   }, 2000);


   // REGISTER a procedure for remote calling
   //
   function add2 (args) {

      var x = args[0];
      var y = args[1];

      console.log("-----------------------");
      console.log("add2() called with " + x + " and " + y);

      return [x + y, componentId, componentType];

   }

   // We register this as a shared registration, i.e. multiple
   // registrations for the same procedure URI are possible.
   // With "roundrobin" these are invoked in turn by Crossbar.io
   // on calls to the procedure URI.
   session.register('com.example.add2', add2, { invoke: "roundrobin"}).then(

      function (reg) {
         console.log("-----------------------");
         console.log('procedure registered: com.myexample.add2');
      },

      function (err) {
         console.log("-----------------------");
         console.log('failed to register procedure', err);
      }

   );


   // CALL a remote procedure every 2 seconds .. forever
   //
   var x = 0;

   t2 = setInterval(function () {

      session.call('com.example.add2', [x, 42]).then(

         function (res) {
            var result = res[0];
            var id = res[1];
            var type = res[2];
            console.log("-----------------------");
            console.log("add2 result:", result);
            console.log("from component " + id + " (" + type + ")");

         },

         function (err) {
            console.log("-----------------------");
            console.log("add2() error:", err);
         }

      );

      x += 1;

   }, 2000);
};


// fired when connection was lost (or could not be established)
//
connection.onclose = function (reason, details) {

   console.log("Connection lost: " + reason);

   clearInterval(t1);
   t1 = null;

   clearInterval(t2);
   t2 = null;

}


// now actually open the connection
//
connection.open();
