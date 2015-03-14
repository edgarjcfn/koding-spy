app.controller('GameController', function($scope, NotificationService, LevelsService, SkulptService) {

    $scope.buttonState = null;
    $scope.game = null;
    $scope.commandQueue = null;
    $scope.editor = null;
    $scope.interpreter = null;

    $scope.runState = {
        text:'Run',
        class: 'btn btn-success btn-lg',
        execute: 'onRunClick'
    }

    $scope.resetState = {
        text:'Reset',
        class: 'btn btn-danger btn-lg',
        execute: 'onResetClick'
    }

    $scope.initCodeEditor = function() {

        $scope.editor = ace.edit("editor");
        var langTools = ace.require("ace/ext/language_tools");

        $scope.editor.setTheme("ace/theme/monokai");
        $scope.editor.getSession().setMode("ace/mode/python");
        $scope.editor.setFontSize('12pt');
        $scope.editor.setHighlightActiveLine(true);

        $scope.editor.setOptions({
            enableBasicAutocompletion: true,
            enableSnippets: true,
            enableLiveAutocompletion: true
        });
        var customCompleter = {
            getCompletions: function(editor, session, pos, prefix, callback) {
              if (prefix.length === 0) { callback(null, []); return }
              callback(null, [
                {name:"moveForward",value:"moveForward(1)",meta:"Move Forward"},
                {name:"turnLeft",value:"turnLeft()",meta:"Turn Left"},
                {name:"turnRight",value:"turnRight()",meta:"Turn Right"},
                ]);
          }
      }

      $scope.editor.completers = [customCompleter, langTools.snippetCompleter];
    };

    $scope.initGameCanvas = function() {
        var subscribe = NotificationService.subscribe;
        var dispatch = NotificationService.dispatch;
        var levels = LevelsService.levels;
        $scope.game = new KodingSpy.Game(subscribe, dispatch, levels);
    }

    $scope.onButtonClicked = function() {
        var fnName = $scope.buttonState.execute;
        var fn = $scope[fnName];
        fn();
    }

    $scope.onLevelStart = function(level) {
        console.log('Loading level code: ' + level);
        var editor = ace.edit('editor');
        var AceRange = ace.require('ace/range').Range;
        editor.setValue('');
        $.ajax({
            url: 'lucy/dev/game/assets/levels/' + level + '.txt',
            success: function(data) {
                  editor.setValue(data, 1);
                  editor.session.addFold("", new AceRange(0,0,1,100));
                  $scope.buttonState = $scope.runState;
                  $scope.$apply();
                }
        });
    }

    //
    // Start SweetAlert
    //
    $scope.showAlert = function (message, diamonds) {
        var msg = {};
        msg.title = message;

        if (diamonds > -1) {
            msg.imageUrl = 'lucy/dev/game/assets/result/resultscreen0'+diamonds+'.png';
        }
        swal(msg);

        // Hacking Sweetalert. Refactor this!
        $('.icon.custom').css({
          'width': '300px',
          'height': '100px'
        });
    }

    $scope.hideAlert = function () {
        // Hacking Sweetalert. Refactor this!
        $('.sweet-alert').hide();
        $('.sweet-overlay').hide();
    }
    //
    // End SweetAlert
    //

    $scope.runCode = function() {
        var code = $scope.editor.getValue();
        $scope.interpreter.runCode(code);
    }

    $scope.onLineExecuted = function(lineNumber) {
        if (lineNumber > 0) {
           $scope.editor.gotoLine(lineNumber);
        }
    }

    $scope.onRunClick = function() {
        $scope.runCode();
        $scope.buttonState = $scope.resetState;
    }

    $scope.onResetClick = function() {
        NotificationService.dispatch('ResetLevel');
        $scope.buttonState = $scope.runState;
    }

    $scope.init = function() {
        NotificationService.subscribe('StartLevel', $scope.onLevelStart);
        NotificationService.subscribe('ShowMessage', $scope.showAlert);
        NotificationService.subscribe('HideMessage', $scope.hideAlert);
        var lineCallback = $scope.onLineExecuted.bind($scope);
        $scope.commandQueue = new KodingSpy.Command.CommandQueue(lineCallback);
        $scope.interpreter = SkulptService;
        $scope.interpreter.initialize($scope.commandQueue);
    };

    $scope.init();

});
