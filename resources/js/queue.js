var app = angular.module('SimulationApp', []);

app.controller('QueueController', function ($scope, $timeout) {
    $scope.numOfServers = 3;
    
    $scope.arriveTimes = 2;

    $scope.attentionTime = 15;
    
    $scope.queueLength = 0;
    
    $scope.doneLength = 0;
    
    $scope.queueFreq = 3111;
    
    $scope.queue = [];
    
    $scope.stDesv = 3.790599752559;
    
    $scope.ticketCount = 1;
    
    $scope.isSimulating = false;
    
    $scope.simular = function () {
        if ($scope.isSimulating) return;
        
        $scope.isSimulating = true;
        
        $scope.queue = [];
        $scope.tiemposDeEspera = [];
        $scope.atendidos = [];
        $scope.ticketCount = 1;
        $scope.doneLength = 0;
        
        $scope.date = new Date(0,0,0,0,0,0,0);
        
        $scope.lastTicketGen = new Date($scope.date.getTime());
        
        setClock();
        
        loadServers();
        
        $scope.queue = [];
        
        $scope.ticketCount = 1;
        
        calculateQueue();
    }
    
    $scope.stop = function () {
        $scope.isSimulating = false;
        $timeout.cancel($scope.mainTO);
        
        $timeout.cancel($scope.clockTO);
    }
    
    function loadServers () {
        if (!$scope.numOfServers) return;
        
        if ($scope.numOfServers > 100 || $scope.numOfServers < 1) return;
        
        $scope.servers = [];
        
        for (var i=0; i < $scope.numOfServers; ++i) {
            $scope.addServer();
        }
    }
    
    $scope.addServer = function() {
        if(!$scope.servers) return;
        
        $scope.servers.push({
            nroMesa: "M" + pad($scope.servers.length + 1, $scope.servers.length.toString().length),
            served: 0
        })
    }
    
    function setClock(){
        document.getElementById('clock').innerHTML = 
            $scope.date.getUTCDay() + " día(s), "
            + $scope.date.getHours() + " hora(s), " 
            + $scope.date.getMinutes() + " minuto(s), "
            + $scope.date.getSeconds()+ " segundo(s)";

            $scope.date.setSeconds($scope.date.getSeconds() + 1);

            if (new Date($scope.date-$scope.lastTicketGen).getMinutes()>= $scope.arriveTimes){
                calculateQueue();
                $scope.lastTicketGen = new Date($scope.date.getTime());
            }
            
            if ($scope.servers){
                $scope.servers.forEach(function (sr){
                    if (sr.attTime && new Date($scope.date - sr.start).getMinutes() >= sr.attTime.split(" minuto(s)")[0]){
                        finishAttention(sr);
                    }
                })
            }
            
            $scope.clockTO = $timeout(function () {
                setClock();
            },1000/$scope.queueFreq);
    }
    
    function calculateQueue () {
        if ($scope.arriveTimes <= 0) return;
        
        var lambda = 1/$scope.arriveTimes;
        
        var q = getPoisson(lambda, $scope.arriveTimes, 0);
        
        generateQueue(q);
    }
    
    
    function generateQueue(q){
        var rand = Math.random();
        
        if(rand > q){
            $scope.queue.push({
                nroTicket: 'T' + pad($scope.ticketCount),
                gen: new Date($scope.date.getTime())
            });
            
            $scope.ticketCount++;
            
            $timeout(function () {
                startPullingQueue();
            },30000/$scope.queueFreq);
        }
    }
    
    function call(server){
        if (!$scope.isSimulating) return;
        
        if (server.ticket) return;

        var ticket = $scope.queue.shift(1);
        
        
        if (ticket){
            ticket.called = new Date($scope.date.getTime());
            var tEspera = ticket.called - ticket.gen;
            $scope.tiemposDeEspera.push({x: ticket.called, y: tEspera});
            updateTEspera();
            var xArray = [];
            var yArray = [];
            
            $scope.tiemposDeEspera.forEach(function (te){
                var xLabel = pad(te.x.getHours(),2) + ":" + pad(te.x.getMinutes(),2) 
                
                if (te.x.getUTCDay()){
                    xLabel =te.x.getUTCDay() + " " +  xLabel; 
                }
                
                xArray.push(xLabel);
                yArray.push(te.y);
            })
            
            var maxNumX = Math.max.apply(null,yArray);
            
            var divisor = 1000
            
            var xAxis = 'Tiempo de Simulación (HH:mm)'
            
            var yAxis = 'Espera en Segundos';
            
            var max = maxNumX/divisor;
            
            if (max > 60){
                divisor*=60;
                max = maxNumX/divisor;
                yAxis = 'Espera en Minutos';
                console.log(max);
                if(max > 60){
                    divisor*=60;
                    max = maxNumX/divisor;
                    yAxis = 'Espera en Horas';
                }
            }
            
            var newArray = [];
            yArray.forEach(function(y) { 
              newArray.push(y/divisor);
            });
            
            plot(xArray, newArray,xAxis,yAxis);
            
            var fDate = getFormatedDate(new Date(tEspera));
            
            ticket.espera = fDate.v + " " + fDate.f;
            
            server.ticket = ticket;
            startAttention(server);
        }
    }
    
    function startPullingQueue(){
        if (!$scope.servers) return;
        
        $scope.servers.forEach(function (s) {
            s.hasCalled = false;
        })
        
        for(var i = 0; i < $scope.servers.length; ++i){
            var server = {};
            do
            {
                var nextServerPosition = (Math.random()*$scope.servers.length).toString().split(".")[0];
                server = $scope.servers[nextServerPosition];
            }
            while(server.hasCalled);
            
            server.hasCalled = true;
            
            call(server);
        }
        
    }
    
    function startAttention(server){
        var attTime = getX(Math.random(), $scope.attentionTime);
        
        server.ticket.start = new Date($scope.date.getTime());
        
        server.attTime = attTime.toString().split(".")[0] + " minuto(s)";
        
        server.start = new Date($scope.date.getTime());
    }
    
    function finishAttention(server){
        if (!$scope.isSimulating) return;
        
        server.served++;
        $scope.doneLength++;
        var ticket = server.ticket;
        
        ticket.finish = new Date($scope.date.getTime());
        
        $scope.atendidos.push(ticket);
        
        server.ticket = undefined;
        server.attTime = undefined;
        
        $timeout(function (){
            call(server);
        },30000/ $scope.queueFreq)
    }
    
    /*Helpers*/
    function getPoisson(lambda, time, n){
        return ( Math.pow(lambda*time,n) * Math.pow(Math.E,-lambda*time) )/ factorial(n);
    }
    
    function getX(z, mean){
        var rand = Math.random();
        
        if (rand > 0.5){
            return (z*$scope.stDesv + mean)
        }
        
        return (-z*$scope.stDesv + mean)
    }
    
    function factorial(n) {
      if (n === 0) return 1;
      
      return n * factorial(n - 1);
    }
    
    function pad(num, size) {
        var s = num+"";
        while (s.length < size) s = "0" + s;
        return s;
    }
    
    function updateTEspera(){
        if (!$scope.tiemposDeEspera || $scope.tiemposDeEspera.length <=0) return;
        var sum = 0;
        $scope.tiemposDeEspera.forEach(function (t) {
            sum += t.y;
        });
        
        $scope.esperaAvg = sum/$scope.tiemposDeEspera.length;
        var fDate = getFormatedDate(new Date($scope.esperaAvg));
        $scope.esperaAvgView = fDate.v + " " + fDate.f;
    }
    
    function getFormatedDate(d){
        var t = d.getTime()/1000;
        
        if (t < 60){
            return {
                v: Math.round(t),
                f: " segundo(s)"
            }
        }
        
        t /=60;
        
        if (t < 60){
            return {
                v: Math.round(t),
                f: " minuto(s)"
            }
        }
        
        t /=60;
        
        return {
            v: Math.round(t),
            f: " hora(s)"
        }
    }
    
    function plot(xArray, yArray, xAxis, yAxis){
        var trace = {
            x: xArray,
            y: yArray,
            mode: 'lines'
        }
        
        var data = [trace];
        var layout = {
          title:'Tiempos de Espera',
          height: 400,
          xaxis: {
            title: xAxis,
            titlefont: {
              family: 'Courier New, monospace',
              size: 18,
              color: '#7f7f7f'
            }
          },
          yaxis: {
            title: yAxis,
            titlefont: {
              family: 'Courier New, monospace',
              size: 18,
              color: '#7f7f7f'
            }
          }
        };
        
        if (window.innerWidth < 700){
            layout.width = window.innerWidth;
        }
        else {
            layout.width = window.innerWidth*0.8;
        }

        Plotly.newPlot('graph', data, layout);
    }
    
    $scope.increaseVel = function (){
        var pgbar = document.getElementById('pgbar');
        var val = parseInt(pgbar.style.width.split("%")[0]);

        if (val >= 100) return;
        
        var incVal = 10;
        
        if (val > 20) incVal = 100;
        
        if (val > 50) incVal = 500;
        
        if (val > 70) incVal = 1000;
        
        $scope.queueFreq += incVal;
        
        pgbar.style.width = val + 1 + '%'
    }
    
    $scope.decreaseVel = function () {
        var pgbar = document.getElementById('pgbar');
        var val = parseInt(pgbar.style.width.split("%")[0]);
        
        if (val <= 0) return;
        
        if (val < 2) {
            $scope.queueFreq = 1;
            pgbar.style.width = '0%';
            return;
        };
        
        var decVal = 10;
        
        if (val > 20) decVal = 100;
        
        if (val > 50) decVal = 500;
        
        if (val > 70) decVal = 1000;
        
        $scope.queueFreq -= decVal;
        
        pgbar.style.width = parseInt(pgbar.style.width.split("%")[0]) - 1 + '%';
        
        if ($scope.queueFreq < 1){
            $scope.queueFreq = 1;
            pgbar.style.width = '0%';
        }
    }
    
    $("#inc").mousedown(function () {
        loopthis = setInterval(function() {
            $scope.increaseVel();
        }, 100);
    }).mouseup(function () {
        clearInterval(loopthis);
    });
    
    $("#dec").mousedown(function () {
        loopthis = setInterval(function () {
            $scope.decreaseVel();
        }, 100);
    }).mouseup(function () {
        clearInterval(loopthis);
    });
});