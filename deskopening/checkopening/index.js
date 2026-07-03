module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
let dateNow = new Date().getTime()
let timeZone = -120
// week hours 0 sunday ...6 Saturday
let workingHrs = {
    0: null,
    1: [
        ["8:00", "12:00"],
        ["14:00", "18:00"]
    ],
    2: [
        ["8:00", "12:00"],
        ["14:00", "18:00"]
    ],
    3: [
        ["8:00", "12:00"],
        ["14:00", "18:00"]
    ],
    4: [
        ["8:00", "12:00"],
        ["14:00", "18:00"]
    ],
    5: [
        ["8:00", "12:00"],
        ["14:00", "18:00"]
    ],
    6: [["08:00", "12:29"], ["12:40", "16:40"]],
}
//Holidays 
let holidays = [new Date("08/17/2020"), new Date("09/19/2020")]

/** function getActualDeskTime **/
/**
This function allow to set the real desk time 
using the offsetZone time indicated in the provisionning page
**/
let getActualDeskTime = (timeZone) => {
    // get server offset
    let offsetinMS = new Date(dateNow).getTimezoneOffset() * 60000
    //get actual desk time by subs serv Timeoffset and deskTimeoffset
    let dateNowFormat = dateNow + (offsetinMS + timeZone * 60000)
    return new Date(dateNowFormat).getTime()
}
/** function checkIfWorkDay **/
/**
Check if the call day is not a holiday
**/
let checkIfWorkDay = (timeZone, holidays) => {
  //Get desk time with offset Zone.
    let ActualDeskTime = getActualDeskTime(timeZone);
    const isHoliday = holidays.some(elm => {
      // is this date is in holiday so is holiday. return false
        if (elm.getFullYear() === new Date(ActualDeskTime).getFullYear() && elm.getMonth() === new Date(ActualDeskTime).getMonth() && elm.getDate() === new Date(ActualDeskTime).getDate()) { 

            return true
        } else { // is working day
            return false
        }
    })
  return !isHoliday
}

let isWorkingHours = (timeZone, workingHrs)=> {
  let ActualDeskTime = getActualDeskTime(timeZone);
  let dayOfWeek= new Date(ActualDeskTime).getDay();
  return  workingHrs[dayOfWeek] == null ? false: workingHrs[dayOfWeek].some(elm=>{
    return moment(ActualDeskTime).isBetween(moment(elm[0],'hh:mm'), moment(elm[1],'hh:mm'))
  })

}
let isDeskHrs=isWorkingHours(timeZone,workingHrs)
let isWorkDay= checkIfWorkDay(timeZone, holidays)

console.log(isWorkDay && isDeskHrs)
    context.res = {
        // status: 200, /* Defaults to 200 */
        body: isWorkDay && isDeskHrs
    };
}