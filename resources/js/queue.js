var app = angular.module('SimulationApp', []);

app.controller('QueueController', function ($scope, $timeout) {
    $scope.numOfServers = 4;
    
    $scope.arriveTimes = 2;

    $scope.attentionTime = 5;
    
    $scope.queueLength = 0;
    
    $scope.doneLength = 0;
    
    $scope.queueFreq = 0.5;
    
    $scope.queue = [];
    
    $scope.stDesv = 3.790599752559;
    
    $scope.ticketCount = 1;
    
    $scope.isSimulating = false;
    
    $scope.simular = function () {
        if ($scope.isSimulating) return;
        
        $scope.isSimulating = true;
        
        $scope.queue = [];
        $scope.ticketCount = 1;
        $scope.doneLength = 0;
        
        $scope.date = new Date(0,0,0,0,0,0,0);
        loadServers();
        
        $scope.queue = [];
        
        $scope.ticketCount = 1;
        
        calculateQueue();
    }
    
    $scope.stop = function () {
        $scope.isSimulating = false;
        $timeout.cancel($scope.mainTO);
    }
    
    function loadServers () {
        if (!$scope.numOfServers) return;
        
        if ($scope.numOfServers > 100 || $scope.numOfServers < 1) return;
        
        var size = $scope.numOfServers.toString().length;
        
        $scope.servers = [];
        
        for (var i=1; i <= $scope.numOfServers; ++i) {
            $scope.servers.push({
                nroMesa: "M" + pad(i, size),
                served: 0
            })
        }
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
            $scope.queue.push('T' + pad($scope.ticketCount));
            $scope.ticketCount++;
        }
        
        $scope.mainTO = $timeout(function () {
            document.getElementById('clock').innerHTML = 
            $scope.date.getUTCDay() + " día(s), "
            + $scope.date.getHours() + " hora(s), " 
            + $scope.date.getMinutes() + " minuto(s), "
            + $scope.date.getSeconds()+ " segundo(s)";
            generateQueue(q);

            $scope.date.setMinutes($scope.date.getMinutes() + $scope.arriveTimes);
            
            $timeout(function (){
                startPullingQueue();
            }, 1000);
            
        }, $scope.queueFreq*1000)
    }
    
    function call(server){
        if (!$scope.isSimulating) return;
        
        if (server.nroTicket && server.nroTicket.length > 0) return;

        var ticket = $scope.queue.shift(1);
        if (ticket){
            server.nroTicket = ticket;
            startAttention(server);
        }
    }
    
    function startPullingQueue(){
        $scope.servers.forEach(function (s) {
            call(s);
        })
    }
    
    function startAttention(server){
        call(server);
        
        var attTime = getX(Math.random(), $scope.attentionTime);
        console.log(attTime);
        $timeout(function () {
            finishAttention(server);
        },attTime * $scope.queueFreq * 1000);
    }
    
    function finishAttention(server){
        if (!$scope.isSimulating) return;
        
        server.served++;
        $scope.doneLength++;
        server.nroTicket = undefined;
        $timeout(function (){
            call(server);
        }, $scope.queueFreq * 5000)
    }
    
    /*Helpers*/
    function getPoisson(lambda, time, n){
        return ( Math.pow(lambda*time,n) * Math.pow(Math.E,-lambda*time) )/ factorial(n);
    }
    
    function getX(z, mean){
        return (z*$scope.stDesv + mean)
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
});