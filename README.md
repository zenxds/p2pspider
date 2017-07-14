## 介绍

p2pspider 是一个 DHT 爬虫 + BT 客户端的结合体, 从全球 DHT 网络里"嗅探"人们正在下载的资源, 并把资源的`metadata`(种子的主要信息)从远程 BT 客户端下载, 并生成资源磁力链接. 通过磁力链接, 你就可以下载到资源文件.

[English document](https://github.com/zenxds/p2pspider#introduction)


## 用途

你可以使用 p2pspider 打造私人种子库(比如: 海盗湾), 也可拿它做资源数据挖掘与分析。

## 安装

```
git clone https://github.com/zenxds/p2pspider
```

## 术语

在P2P网络中，要通过种子文件下载一个资源，需要知道整个P2P网络中有哪些计算机正在下载/上传该资源。这里将这些提供某个资源下载的计算机定义为peer。下载这个资源当然得首先取得这些peer。

DHT的出现用于解决当tracker服务器不可用时，P2P客户端依然可以取得某个资源的peer。DHT解决这个问题，是因为它将原来tracker上的资源peer信息分散到了整个网络中。

实现了DHT协议的计算机定义为节点(node)。通常一个P2P客户端程序既是peer也是节点。

"peer" 是在一个 TCP 端口上监听的客户端/服务器，它实现了 BitTorrent 协议。

"节点" 是在一个 UDP 端口上监听的客户端/服务器，它实现了 DHT(分布式哈希表) 协议。

资源的标识在DHT网络中称为infohash，是一个20字节长的字符串，一般通过sha1算法获得，也就是一个类似UUID的东西。

## 协议

[bep_0005](http://www.bittorrent.org/beps/bep_0005.html), [bep_0003](http://www.bittorrent.org/beps/bep_0003.html), [bep_0010](http://www.bittorrent.org/beps/bep_0010.html), [bep_0009](http://www.bittorrent.org/beps/bep_0009.html)

## 感谢

在开发这个项目时, 从 [bittorrent-protocol](https://github.com/feross/bittorrent-protocol) 和  [ut_metadata](https://github.com/feross/ut_metadata) 借鉴了一些实现代码. 非常感谢其作者 [@feross](https://github.com/feross) 指点迷津.

## 提醒

不要拿这个爬虫爬取的数据分享到互联网, 因为很多敏感资源; 色情资源; 侵权资源. 否则后果自负喔. 如果真的开放了给别人, 也不要告诉我, 我他妈的不关心!

## 许可证

MIT