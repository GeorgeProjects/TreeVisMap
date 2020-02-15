export default function makeTreeUnits (treeData, treeDsls, treeDic) {
    let treeUnits = {}
    let index = treeData.index
    let dslName = index in treeDic ? treeDic[index] : treeDic.default
    let dsl = treeDsls[dslName]
    if (dsl.Layout.Category === 'AxisIndependent') {
        treeUnits[index] = {
            data: treeData,
            dsl: dsl
        }
    }

    treeData.children.forEach((subtreeData) => {
        Object.assign(treeUnits, makeTreeUnits(subtreeData, treeDsls, treeDic))
    })
    
    return treeUnits
}