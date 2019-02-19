describe('CustomApp', function() {

    it('should render the app blahblah', function() {
        var app = Rally.test.Harness.launchApp('CustomApp');
        expect(app.getEl()).toBeDefined();
    });
    
    
    it('should have an epic combo box', function() {
        var app = Rally.test.Harness.launchApp('CustomApp');
        expect(app.down('#epic-combobox')).toBeDefined();
    });
    
    
    // Write app tests here!
    // Useful resources:
    // =================
    // Testing Apps Guide: https://help.rallydev.com/apps/2.1/doc/#!/guide/testing_apps
    // SDK2 Test Utilities: https://github.com/RallyApps/sdk2-test-utils
    
    it('no idea how this works', function() {
      //Get 3 defect records
      console.log('entering test');
      var defectRecords = Rally.test.Mock.dataFactory.getRecords('defect', { count: 3 });
      console.log(defectRecords);
      expect(1).toBeDefined();
      
    });
    
     it('dont understand this either', function() {
      var userstory = {
                _ref: '/userstory/12345',
                ObjectID: 12345,
                Name: 'fairy wings',
                State: 'Backlog',
                Description: 'As a fairy, I need wings so I can fly from tree to tree.'
            };
    
      var storyQueryMock = Rally.test.Mock.ajax.whenQuerying('User Story').respondWith([
      { _ref: '/userstory/23456', ObjectID: 23456, Name: 'Story 1'},
      { _ref: '/userstory/34567', ObjectID: 34567, Name: 'Story 2'}
      ]);
      
      console.log(storyQueryMock);
      
      var queryCall = storyQueryMock.firstCall.args[0];
      expect(queryCall.params.query).toBe('(Blocked = true)');
    
    });
});



