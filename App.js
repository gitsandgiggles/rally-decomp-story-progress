Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    
    
    StoryMapBoard: undefined,
    
    launch: function() {
        //Write app code here

        //API Docs: https://help.rallydev.com/apps/2.1/doc/
        console.log('Hello world! I am the decomp stry progress viewer in v0.1 change 2');
        
        me = this;
        me._loadIterations();
        console.log('iterations loaded');
        //me._loadData();


    },
    
     // create and load iteration pulldown 
    _loadIterations: function() {
        console.log('called _loadIterations');
      
        var me = this;

        var iterComboBox = Ext.create('Rally.ui.combobox.IterationComboBox', {
          itemId: 'iteration-combobox',     // we'll use this item ID later to get the users' selection
          fieldLabel: 'Iteration',
          labelAlign: 'right',
          width: 300,
          listeners: {
            ready: me._loadSchedules,      // initialization flow: next, load severities
            select: me._loadData,           // user interactivity: when they choose a value, (re)load the data
            scope: me
         }
        });

        me.add(iterComboBox); 
     },

    _loadSchedules: function(){
      console.log('called _loadSchedules');
      me = this;
      
      me.add({
           xtype: 'rallyfieldvaluecombobox',
           itemId: 'state-combobox',
           
           model: 'UserStory',
           multiSelect: true,
           field: 'ScheduleState',
           value: ['Defined', 'Backlog', 'In-Progress', 'Completed'],
           
          fieldLabel: 'Schedule State',
          labelAlign: 'right',
           
           listeners: {
                select: me._loadData,
                ready: me._loadData,
                scope: me
            }
        });
    },
    
    
    _getFilters: function(states, iter){
      
      console.log('Yo! Amma gettin ma filters');
      console.log('my iter is ',iter);
      
      var myFilters = undefined;
      var currFilter = undefined;
      
      states.forEach(function(state){
        currFilter = Ext.create('Rally.data.wsapi.Filter', {
          property: 'ScheduleState',
          operation: '=',
          value: state
        });
        if (myFilters) {
            myFilters = myFilters.or(currFilter);
        }else {
            myFilters = currFilter;
        }
        console.log('state: ', state);
        console.log('myFilters: ', myFilters);
      });
      
      // iteration filter
      
      //debug - get this iteration, find the date
     // me = this;
      console.log('ieration: ', me.down('#iteration-combobox').getRecord());
      console.log('start date: ', me.down('#iteration-combobox').getRecord().data.StartDate.toISOString());
      iterDate  = me.down('#iteration-combobox').getRecord().data.StartDate.toISOString();
      
      var iterFilter = Ext.create('Rally.data.wsapi.Filter', {
        property: 'Iteration.StartDate',
        operator: '>=',
        value: iterDate
      });
      
     myFilters = myFilters.and(iterFilter);
      
      return myFilters     
    },
    
    _loadData: function(){
     
      console.log('called _loadData');
      me = this;      
      var myFilters = me._getFilters(me.down('#state-combobox').getValue(), me.down('#iteration-combobox').getRecord().get('_ref'));
      
      
      if (myFilters) {

       
        if (me.StoryMapBoard) {

           me.StoryMapBoard.refresh({
                  storeConfig: {
                    filters: myFilters
                  }
           });
          
        } else {
        
          me.StoryMapBoard = Ext.create('Rally.ui.cardboard.CardBoard',{
                //xtype: 'rallycardboard',
                types: ['User Story'],
                attribute: 'Iteration',
                context: this.getContext(),
                rowConfig: {
                    field: 'PortfolioItem'
                },
                cardConfig: {
                    fields: [
                              'Name',
                              'ScheduleState'
                    ]
                },
                
                storeConfig: {
                    filters: myFilters,
                    context:{
                              project:'/project/215859356248',
                              projectScopeUp: false,
                              projectScopeDown: false
                            }
                }
            });
        
          me.add(me.StoryMapBoard);
        }
      } else {
          console.log('No states selected');
      }
         
    }    
// grouped card board====     
          
          
          
          
          
                
//to do:

// change column to iteration - done :)

// change row to parent hierarchy - done-ish - can have parent or Epic but  not  both. (Parent or PortfolioItem)

// indicate state - done :)

// add a scheduleState picker - done

// remove empty columns

// indicate size and progress vs tasks
// navigate from current project only, up to epics, then select anything from other squads as well. Mark somehow
 

});


