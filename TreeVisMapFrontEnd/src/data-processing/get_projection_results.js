//  导出层次结构数据
export async function getProjectionResults() {
    //  全局的graph对象
    console.log('getProjectionResults')
    var data = await d3.json('projectionResults/partial10000.json')
    return data
}