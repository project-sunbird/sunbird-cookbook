
let regexPattern = /[^a-zA-Z0-9]/g;
let termSet = new Set();

function Term(values) {
    this._termArray = values;
}

Term.prototype.getFilterTerm = function() {

    return this._termArray.reduce(function (obj, item,index) {
        obj['Board'] = obj['Board'] || [];
        let board = item['Board'].replace(regexPattern, '').toLowerCase();
        let boardObj = {
                "name": item['Board'],
                "label": item['Board'],
                "description": item['Board'],
                "code": board,
                "index":index
            };
        if(board && !termSet.has(board)) {
            termSet.add(board);
            obj['Board'].push(boardObj);
        }
        
        obj['Grade'] = obj['Grade'] || [];
        let grade = item['Grade'].replace(regexPattern, '').toLowerCase();
        let gradeObj = {
                "name": item['Grade'],
                "label": item['Grade'],
                "description": item['Grade'],
                "code": grade,
                  "index":index
            };
         if(grade && !termSet.has(grade)){
            termSet.add(grade);
            obj['Grade'].push(gradeObj);
        }
        
        obj['Medium'] = obj['Medium'] || [];
        let medium = item['Medium'].replace(regexPattern, '').toLowerCase();
        let mediumObj = {
                "name": item['Medium'],
                "label": item['Medium'],
                "description": item['Medium'],
                "code": medium,
                  "index":index
            };
         if(medium && !termSet.has(medium)){
            termSet.add(medium);
            obj['Medium'].push(mediumObj);
        }
        
        obj['Subject'] = obj['Subject'] || [];
        let subject = item['Subject'].replace(regexPattern, '').toLowerCase();
        let subjectObj = {
                "name": item['Subject'],
                "label": item['Subject'],
                "description": item['Subject'],
                "code": subject,
                  "index":index
            };
         if(subject && !termSet.has(subject)){
            termSet.add(subject);
            obj['Subject'].push(subjectObj);
        }
        
        
        obj['L1'] = obj['L1'] || [];
        let l1 = item['Chapter - Concept Name'];
        var l1_value = subject+'_'+l1.replace(regexPattern, '').toLowerCase();  
        let l1Obj = {
                "name": l1,
                "label": l1,
                "description": l1,
                "code": l1_value,
                "index":index
            };
         if(l1 != 'NA' && !termSet.has(l1_value)){
            termSet.add(l1_value);
            obj['L1'].push(l1Obj);
        }
        
        return obj;
        
    }, {});
}

// expose Term

module.exports = Term;