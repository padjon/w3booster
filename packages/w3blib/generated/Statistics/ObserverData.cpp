#include "ObserverData.h"

namespace Blizzard::Net::Warcraft3::Statistics
{

const std::wstring ObserverData::MEMORY_MAPPED_FILENAME = L"War3StatsObserverSharedMemory";

	bool ObserverData::TryOpen(ObserverData *&observerData)
	{
		try
		{
			auto memoryMappedFile = MemoryMappedFile::OpenExisting(MEMORY_MAPPED_FILENAME, MemoryMappedFileRights::ReadWrite);
			observerData = new ObserverData(memoryMappedFile);
			return true;
		}
		catch (const FileNotFoundException &e1)
		{
			observerData = nullptr;
			return false;
		}
	}

	ObserverData::ObserverData(MemoryMappedFile *memoryMappedFile) : memoryMappedFile(memoryMappedFile), mappedViewAccessor(memoryMappedFile->CreateViewAccessor())
	{
//C# TO C++ CONVERTER TODO TASK: C# 'unsafe' code is not converted by C# to C++ Converter:
//		unsafe
	//			{
	//				var pointer = (byte * )0;
	//				mappedViewAccessor.SafeMemoryMappedViewHandle.AcquirePointer(ref pointer);
	//				this.data = pointer;
	//			}
	}

	ObserverData::ObserverData() : ObserverData(MemoryMappedFile::OpenExisting(MEMORY_MAPPED_FILENAME, MemoryMappedFileRights::ReadWrite))
	{
	}

	ObserverData::~ObserverData()
	{
		delete memoryMappedFile;
		delete mappedViewAccessor;
		delete byte;
		delete this->mappedViewAccessor;
		delete this->memoryMappedFile;
	}

	unsigned int ObserverData::getVersion() const
	{
//C# TO C++ CONVERTER TODO TASK: C# 'unsafe' code is not converted by C# to C++ Converter:
//		unsafe
	//				{
	//					return * (uint * ) & this.data[VERSION_OFFSET];
	//				}
	}

	unsigned int ObserverData::getRefreshRate() const
	{
//C# TO C++ CONVERTER TODO TASK: C# 'unsafe' code is not converted by C# to C++ Converter:
//		unsafe
	//				{
	//					return * (uint * ) & this.data[REFRESH_RATE_OFFSET];
	//				}
	}

	void ObserverData::setRefreshRate(unsigned int value)
	{
//C# TO C++ CONVERTER TODO TASK: C# 'unsafe' code is not converted by C# to C++ Converter:
//		unsafe
	//				{
	//					* (uint * ) & this.data[REFRESH_RATE_OFFSET] = value;
	//				}
	}

	Span<PlayerInfo> *ObserverData::getPlayers() const
	{
//C# TO C++ CONVERTER TODO TASK: C# 'unsafe' code is not converted by C# to C++ Converter:
//		unsafe
	//				{
	//					return new Span<PlayerInfo>( & this.data[PLAYERS_OFFSET], MAX_PLAYERS);
	//				}
	}

	Span<ShopInfo> *ObserverData::getShops() const
	{
//C# TO C++ CONVERTER TODO TASK: C# 'unsafe' code is not converted by C# to C++ Converter:
//		unsafe
	//				{
	//					return new Span<ShopInfo>( & this.data[SHOPS_OFFSET], (int) * (uint * ) & this.data[SHOPS_COUNT_OFFSET]);
	//				}
	}
}
