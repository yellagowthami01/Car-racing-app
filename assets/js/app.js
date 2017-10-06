function randomNm(num, limitLower, limitUpper) {
  var set = [];
  while (num) {
    var x = Number(
      Math.floor(Math.random() * (limitUpper - limitLower)) + limitLower
    );
    if (set.indexOf(x) === -1) {
      set.push(x);
    }
    if (set.length == num) {
      num = 0;
    }
  }
  return set;
}

function Truck(id, color, bet, speed, lapseTime, win) {
  this.id = id;
  this.betAmount = bet || 0;
  this.color = color || "";
  this.speed = speed;
  this.lapseTime = lapseTime;
  this.isWin = win;
}

function User(name, loadAmount, noOfTrucks) {
  this.playerName = name;
  this.availAmount = Number(loadAmount) || 1000;
  this.availTrucks = [
    "green",
    "red",
    "blue",
    "brown",
    "pink",
    "black",
    "cyan"
  ];
  this.truckSpeeds = [
    "cubic-bezier(0.35, 0.14, 0.67, 0.71)",
    "cubic-bezier(0.46, 0.03, 0.5, 0.97)",
    "cubic-bezier(0.4,-0.01, 1, 1)",
    "cubic-bezier(0.15, 0.57, 0.92, 0.74)",
    "cubic-bezier(0.46, 0.94, 0.94, 0.76)",
    "cubic-bezier(0,-0.01, 0.58, 1)",
    "cubic-bezier(0.75, 0.34, 0.92, 0.95)",
  ];
  this.defaultTrucks = 2;
  this.selectedTrucks =
    noOfTrucks && noOfTrucks <= 8 ? noOfTrucks : this.defaultTrucks;
  this.pickedTrucks = randomNm(
    this.selectedTrucks,
    0,
    this.availTrucks.length - 1
  );
  this.betAmountOnPickedTrucks = [];
  this.speedBais = 0;
}
User.prototype.setPickedTruckObjs = function () {
  this.randomTruckSpeeds = randomNm(
    this.selectedTrucks,
    0,
    this.truckSpeeds.length - 1
  );
  this.winMatrix = randomNm(this.selectedTrucks, 15, 25);
  this.wonTruck = Math.min.apply(null, this.winMatrix);
  var self = this;
  this.pickedTruckObjs = this.pickedTrucks.map(function(color, index) {
    return new Truck(
      index,
      self.availTrucks[index],
      self.betAmountOnPickedTrucks.length ? self.betAmountOnPickedTrucks[index] : 0,
      self.truckSpeeds[self.randomTruckSpeeds[index]],
      self.winMatrix[index],
      self.wonTruck === self.winMatrix[index]
    );
  });
};

function prepareTruckMarkup(arr) {
  var windText;
  return arr.reduce(function (all, obj, idx) {
    var style =
      "animation: race " +
      obj.lapseTime +
      "s " +
      obj.speed +
      " forwards;";
    windText = obj.betAmount ? "$" + obj.betAmount : "";
    return (
      all +
      '<div class="box' +
      idx +
      '"><div class="track ' + obj.color + '" style="' +
      style +
      '" data-color="' +
      obj.color +
      '" data-win="' +
      obj.isWin +
      '"><span class="bet-text">' + windText + '</span><i class="fa fa-truck"></i></div></div>');
  }, "");
}

function prepareTruckControls(arr) {
  return arr.reduce(function (all, obj, idx) {
    return (
      all +
      '<div class="form-group"><label for="truck' +
      obj.id +
      '" class="control-label col-sm-6">Trucker ' +
      (obj.id + 1) +
      "(" +
      obj.color +
      ')</label><div class="col-sm-6"><input type="number" id="truck' +
      obj.id +
      '" class="form-control" value="0"/></div></div>'
    );
  }, "");
}

var user;
$(function () {
  $("#reset").on('click', function () {
    $(".game a").trigger('click');
    $(".mad").addClass("disabled");
    $(".error").empty();
    $(".success").empty();
  });


  $(".disabled").on("click", function (e) {
    if ($(this).hasClass("disabled")) {
      e.preventDefault();
      return false;
    }
  });
  $("#myModal").on('show.bs.modal', function () {
    $(".error").empty();
    $("#bet-formcontrols :input").each(function (idx, el) {
      $(el).val(0);
    });
  })

  $("#startGame").on('click', function (e) {
    var dataObj = {};
    var error = false;
    $(".home :input").each(function (idx, el) {
      var $el = $(el);
      if (!$el.val()) {
        $el.parents('.form-group').addClass('has-error');
        error = true;
      } else {
        dataObj[$el.attr('id')] = $el.val();
        $el.parents('.form-group').removeClass('has-error');
      }
    });
    if (error) {
      e.preventDefault();
      return false;
    }
    $(".mad").removeClass("disabled");
    $(".mad a").trigger('click', [dataObj]);
  });
  $(".mad a").on('click', handlerMadTrucker);

  function handlerMadTrucker(e, data) {
    user = new User(data.playerName, data.availAmount, data.noOfTrucks);
    user.setPickedTruckObjs();
    $(".user").html(user.playerName);
    $(".amount").html(user.availAmount);
    $(".race").empty();
    $("#bet-formcontrols").empty();
    $(prepareTruckMarkup(user.pickedTruckObjs)).appendTo($(".race"));
    $(prepareTruckControls(user.pickedTruckObjs)).appendTo($("#bet-formcontrols"));

    $("#submitBet").on('click', function (e) {
      var error = false;
      var dataObj = {};
      var totalBetAmount = 0;
      var betAmountOnPickedTrucks = [];
      $("#bet-formcontrols :input").each(function (idx, el) {
        var $el = $(el);
        if ($el.val() < 0) {
          $el.parents('.form-group').addClass('has-error');
          error = true;
        } else {
          dataObj[$el.attr('id')] = Number($el.val());
          betAmountOnPickedTrucks.push(Number($el.val()));
          $el.parents('.form-group').removeClass('has-error');
        }
      });
      for (i in dataObj) {
        if (dataObj.hasOwnProperty(i)) {
          totalBetAmount += dataObj[i];
        }
      }
      if (error) {
        $(".error").html('Bet amount is invalid')
      } else if (totalBetAmount > user.availAmount) {
        $(".error").html('Your Accumulated amount is less than total Bet Amount');
      } else if (totalBetAmount == 0) {
        $(".error").html('Please Bet inorder to start the Race');
      } else {
        $(".error").empty();
        user.betAmountOnPickedTrucks = betAmountOnPickedTrucks;
        user.setPickedTruckObjs();
        $(".race").empty();
        $("#myModal").modal("hide");
        $(prepareTruckMarkup(user.pickedTruckObjs)).appendTo($(".race"));
        $(".success").empty();
        $("#play").removeClass('disabled');
      }
    })
    $("#play").on("click", function (e) {
      if ($(this).hasClass("disabled")) {
        e.preventDefault();
        return false;
      }
      $(this).addClass("disabled")
      $(".race").addClass("play");
      setTimeout(function () {
        $(".race").removeClass("play");
        var jqarr = $.grep(user.pickedTruckObjs, function(v){return v.isWin});
        var winAmount = jqarr[0].betAmount;
        if (winAmount) {
          user.availAmount += winAmount * 2;
          $(".success").html("*** Congrats, You Won $" + winAmount + "! ***");
        }
        var lostAmount = $.grep(user.pickedTruckObjs, function(v){return !v.isWin}).reduce(function (all, item, idx) {
            return all + item.betAmount;
          }, 0);
        if (lostAmount) {
          user.availAmount -= lostAmount;
        }
        $("a[data-win='true']")
          .parent()
          .addClass("win");
        $(".amount").html(user.availAmount);
      }, user.wonTruck * 1000);
    });
  }

});