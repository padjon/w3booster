#pragma once

namespace Blizzard::Net::Warcraft3::Statistics
{
//C# TO C++ CONVERTER TODO TASK: C# 'unsafe' code is not converted by C# to C++ Converter:
//C# TO C++ CONVERTER NOTE: The following .NET attribute has no direct equivalent in C++:
//ORIGINAL LINE: [StructLayout(LayoutKind.Sequential, Pack = 1)] public unsafe struct PlayerItemInfo
//	public unsafe struct PlayerItemInfo
//	{
//		public const int MAX_NAME_LENGTH = 100;
//
//		public const int SIZE = sizeof(uint) + MAX_NAME_LENGTH * sizeof(byte) + sizeof(uint) + sizeof(uint) + sizeof(uint) + sizeof(uint) + sizeof(uint) + sizeof(uint) + sizeof(uint) + sizeof(uint);
//
//		public readonly uint Id;
//
//		[MarshalAs(UnmanagedType.ByValTStr, SizeConst = MAX_NAME_LENGTH)] private fixed byte name[MAX_NAME_LENGTH];
//
//		public readonly uint ItemLevel;
//
//		public readonly uint Collected;
//
//		public readonly uint Purchased;
//
//		public readonly uint Sold;
//
//		public readonly uint Used;
//
//		public readonly uint Destroyed;
//
//		public readonly uint DamageDealt;
//
//		public readonly uint HealingDone;
//
//		public string Name
//		{
//			get
//			{
//				fixed (byte * pName = this.name)
//				{
//					return Marshal.PtrToStringAnsi(new IntPtr(pName));
//				}
//			}
//		}
//	}
}
