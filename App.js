Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    launch: function() {
        //Write app code here

        //API Docs: https://help.rallydev.com/apps/2.1/doc/
        console.log('Hello world! I am the decomp stry progress viewer in v0.1 change 2');
        
 /* simple card board====       
        var cardBoardConfig = {
            xtype: 'rallycardboard',
            types: ['Defect', 'User Story'],
            attribute: 'ScheduleState',
        };
        this.cardBoard = this.add(cardBoardConfig);   
    }
*/

// grouped card board====     
          this.add({
                        xtype: 'rallycardboard',
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
                        }
                    });
                }
                
//to do:

// change column to iteration - done :)

// change row to parent hierarchy - done-ish - can have parent or Epic but  not  both. (Parent or PortfolioItem)

// indicate state - done :)
// indicate size and progress vs tasks
// navigate from current project only, up to epics, then select anything from other squads as well. Mark somehow
 

});


