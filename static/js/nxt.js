function Event(count, timestamp, priority, func, params) {
  this.count = count;
  this.timestamp = timestamp;
  this.priority = priority;
  this.func = func;
  this.params = params;
}

function lifoRank(e1, e2) {
  if (e1.count == e2.count) return 0;

  // Defaults to LIFO
  var result = (e1.count > e2.count) ? -1 : 1;
  if (e1.timestamp == e2.timestamp) {
    if (e1.priority != e2.priority) {
      result = (e1.priority < e2.priority) ? -1 : 1;
    }
  } else {
    result = (e1.timestamp < e2.timestamp) ? -1 : 1;
  }

  return result;
}

function Scheduler(eventRanker) {
  var self = this;
  var _clock = 0;
  var _count = 0;

  var _pendingEvents = new Heap(eventRanker);

  self.getClock = function() {
    return _clock;
  }

  self.getCount = function() {
    return _count;
  }

  self.schedule = function(offset, priority, func, params) {
    var futureEvent = new Event(_count, _clock + offset, priority, func, params);
    _pendingEvents.push(futureEvent);
    _count += 1;
  }

  self.hasNext = function() {
    return !_pendingEvents.empty();
  }

  self.next = function() {
    var currentEvent = _pendingEvents.pop();
    _clock = currentEvent.timestamp;

    return currentEvent;
  }
}

function Engine(eventRanker) {
  var self = this;
  self.eventRanker = eventRanker;

  self.execute = function(scenario, duration) {
    var scheduler = new Scheduler(self.eventRanker);
    scenario._init(scheduler);

    while (scheduler.hasNext()) {
      var currentEvent = scheduler.next();
      if (currentEvent.timestamp > duration) break;

      currentEvent.func(scheduler, currentEvent.params);
    }
  }
}

function CarWash(servers, queue) {
  var self = this;
  self.servers = servers;
  self.queue = queue;
  
  self._init = function(scheduler) {
    scheduler.schedule(0, 5, self.enter, null);
  }

  self.enter = function(scheduler, params) {
    self.queue += 1;

    if (self.servers > 0)
      scheduler.schedule(0, 5, self.start, null);
    scheduler.schedule(3, 5, self.enter, null);
  }

  self.start = function(scheduler, params) {
    self.queue -= 1;
    self.servers -= 1;
    
    scheduler.schedule(4, 5, self.leave, null);
  }

  self.leave = function(scheduler, params) {
    self.servers += 1;
    
    if (self.queue > 0)
      scheduler.schedule(0, 5, self.start, null);
  }
}