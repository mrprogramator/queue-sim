var app = angular.module('SimulationApp', []);

app.controller('QueueController', function ($scope, $timeout) {
    $scope.numOfServers = 4;
    
    $scope.arriveTimes = 2;

    $scope.attentionTime = 5;
    
    $scope.queueLength = 0;
    
    $scope.doneLength = 0;
    
    $scope.queueFreq = 0.01;
    
    $scope.queue = [];
    
    $scope.simular = function () {
        $scope.date = new Date();
        loadServers();
        
        $scope.queue = [];
        
        calculateQueue();
    }
    
    function loadServers () {
        if (!$scope.numOfServers) return;
        
        if ($scope.numOfServers > 100 || $scope.numOfServers < 1) return;
        
        var size = $scope.numOfServers.toString().length;
        
        $scope.servers = [];
        
        for (var i=1; i <= $scope.numOfServers; ++i) {
            $scope.servers.push({
                nroMesa: "M" + pad(i, size),
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
        console.log('generating queue....',rand, q);
        
        if(rand > q){
            $scope.queue.push({x:'X'});
        }
        
        $timeout(function () {
            document.getElementById('clock').innerHTML = $scope.date.toLocaleTimeString();
            generateQueue(q);
            $scope.date.setMinutes($scope.date.getMinutes() + $scope.arriveTimes);
        }, $scope.queueFreq*60*1000)
    }
    
    /*Helpers*/
    function getPoisson(lambda, time, n){
        return ( Math.pow(lambda*time,n) * Math.pow(Math.E,-lambda*time) )/ factorial(n);
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