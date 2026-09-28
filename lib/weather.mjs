export async function getWeather(date) {
  const url='https://api.open-meteo.com/v1/forecast?latitude=28.15&longitude=120.53&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FShanghai&forecast_days=7';
  const response=await fetch(url,{signal:AbortSignal.timeout(10000)});
  if(!response.ok) throw new Error('天气服务暂不可用。');
  const data=await response.json(), daily=data.daily, index=daily?.time?.indexOf(date)??-1;
  if(index<0) return {available:false,message:'该日期不在当前 7 日预报内，未推测天气。',source:'https://open-meteo.com/'};
  return {available:true,date,min:daily.temperature_2m_min[index],max:daily.temperature_2m_max[index],rainProbability:daily.precipitation_probability_max[index],code:daily.weather_code[index],scope:'县域参考点预报，非景点逐点预报',coordinates:{latitude:28.15,longitude:120.53},retrievedAt:new Date().toISOString(),source:'https://open-meteo.com/'};
}
