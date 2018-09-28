Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    
    items: [      // pre-define the general layout of the app; the skeleton (ie. header, content, footer)
      {
        xtype: 'container', // this container lets us control the layout of the pulldowns; they'll be added below
        itemId: 'pulldown-container',
        layout: {
                type: 'hbox',           // 'horizontal' layout
                align: 'stretch',
                padding: '5'
            }
      }
    ],
    
    
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
          fieldLabel: 'Start from:',
          labelAlign: 'right',
          width: 500,
          listeners: {
            ready: me._loadSchedules,      // initialization flow: next, load schedules
            select: me._loadData,           // user interactivity: when they choose a value, (re)load the data
            scope: me
         }
        });

        me.down('#pulldown-container').add(iterComboBox); 
        //me.add(iterComboBox); 
     },

    _loadSchedules: function(){
      console.log('called _loadSchedules');
      me = this;
      
     //me.add({
     me.down('#pulldown-container').add({
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
                ready: me._loadHideCheck,
                scope: me
            }
        });
    },
    
    
    _loadHideCheck: function(){
      console.log('called _loadHideCheck');
      var me = this;
     
      //me.add({
      me.down('#pulldown-container').add({
          xtype: 'rallycheckboxfield',
          boxLabel: 'Show empty iterations',
          itemId: 'hidecheckbox',
          value: true,
          width: 300,
          padding: '0 0 0 30',
           
           listeners: {
                change: me._loadData,
                added: me._loadData,
                scope: me
            }
        });
    },
    
    
    _getFilters: function(states, iter){
      
      var myFilters = undefined;
      var currFilter = undefined;
      
      // state filter
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
      });
      
      // iteration filter
      iterDate  = me.down('#iteration-combobox').getRecord().data.StartDate.toISOString();
      
      var iterFilter1 = Ext.create('Rally.data.wsapi.Filter', {
        property: 'Iteration.StartDate',
        operator: '>=',
        value: iterDate
      });
      
      // don't exclude None iteration
      var iterFilter = iterFilter1.or(
          Ext.create('Rally.data.wsapi.Filter', {
            property: 'Iteration',
            operator: '=',
            value: null
          })
      );
      
      myFilters = myFilters.and(iterFilter);
      return myFilters     
    },
    
    _hideEmptyColumns(cols){
      
      var me = this;
      
      var showEmpty  = me.down('#hidecheckbox').getValue();
      var firstIter = me.down('#iteration-combobox').getRecord().get('Name');
      var preFirstIter = true;

      _.each(cols, function(col) {
          var cardsInCol = col.getCards();
          var cardCount = _.flatten(_.values(cardsInCol)).length;
          
          
          if (col.getColumnHeaderConfig().headerTpl === firstIter){
              preFirstIter = false;
          }
          
          // always hide all columns before the selected iteration except None, as they will never have cards
          // if hide empty is on, also hide all columns after current iteration that have no cards
          
          if((preFirstIter && col.getColumnHeaderConfig().headerTpl != 'None') || (cardCount === 0 && !showEmpty)) {
              col.setVisible(false);
          } else {
             col.setVisible(true);
          }
          
      });
      
    },
    
    _onBoardLoaded: function(board, config){

      var me = this;
      me._hideEmptyColumns(board.getColumns());    
    },
    
    _loadData: function(){
    
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
                
                listeners: {
                              load: me._onBoardLoaded,
                              scope: me
                              },
                
                storeConfig: {
                    filters: myFilters,
                    context:{
                              project:'/project/215859356248',
                              projectScopeUp: false,
                              projectScopeDown: false
                            },
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

// remove empty columns - done

// put "None" back - done

// refactor with a horiz layout - done

// put date in the header as well

// add title

// add Epic selector -  select Epic shows parent stories, no Epic shows epic

// add project selector

// indicate size and progress vs tasks
// navigate from current project only, up to epics, then select anything from other squads as well. Mark somehow
 

});


