'use strict';
function itemsOf(response) {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  throw new Error('同步响应格式异常');
}
async function syncProgress(api, entry, recordHistory) {
  const {eid,pid,progress,playedAt}=entry;
  const remote=itemsOf(await api('/v1/playback-progress/list',{eids:[eid]})).find(item=>item.eid===eid);
  if(remote && Date.parse(remote.playedAt)>Date.parse(playedAt))return {status:'conflict',historyRecorded:false};
  const seconds=Math.floor(progress);
  await api('/v1/playback-progress/update',{data:[{eid,pid,progress:seconds,playedAt}]});
  const saved=itemsOf(await api('/v1/playback-progress/list',{eids:[eid]})).find(item=>item.eid===eid);
  if(!saved || !Number.isFinite(Number(saved.progress)) || Math.abs(Number(saved.progress)-seconds)>1)throw new Error('服务器进度回读校验未通过，请稍后重试');
  if(recordHistory)await api('/v1/episode-played/create',{eid});
  return {status:'ok',historyRecorded:!!recordHistory};
}
module.exports={syncProgress};
