---
trigger: always_on
alwaysApply: true
---
---
trigger: always_on
alwaysApply: true
- name: "taotao"
- 修改内容后不需要重启项目
- 项目服务重新启动前先停止该项目：taskkill /f /im node.exe 后在重新启动，在启动数据库node server.cjs
- 命令执行的环境是windows下，不能用&&
- 出现先出方案的情况时，需带用户确定在开始实施修改
- E:\NovelSystem\taotao-writing-master\.backup10.15下的所有文件都是备份资料，不是项目的文件，如果误删了文件可以通过这里进行拷贝恢复。